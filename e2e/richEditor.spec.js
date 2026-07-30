// Thread rich-text editor browser journeys - see featureplans/threads-rich-editor.md.
// Creating a thread from scratch needs the Google Places suburb picker (not scriptable), so the
// editor's live behaviour is exercised on /threads/new, and the create/edit RENDER is proven against
// seeded threads (the edit thread is first visited after its edit, so the ISR page is fresh).
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';
import { tidyUrl } from '../utils/helpers/threads/richText.js';

test.use({ storageState: 'e2e/.auth/member.json' });

const editorBody = (page) => page.locator('.thread-editor-content');

test('AC6 the editor auto-links a typed URL live, and a rich thread renders formatting + a safe link', async ({ page }) => {
  const seed = readSeed();

  // Editor half: on /threads/new, typing a URL then a space auto-links it (teal, URL as its own text).
  await page.goto('/threads/new');
  await expect(editorBody(page)).toBeVisible({ timeout: 20_000 });
  await editorBody(page).click();
  await editorBody(page).pressSequentially('Visit https://typed.example.com ');
  // The link's visible text is the tidied display (scheme stripped); the href stays the full URL.
  const liveLink = editorBody(page).locator('a', { hasText: 'typed.example.com' });
  await expect(liveLink).toBeVisible();

  // Toolbar half: select all and bold it (keyboard selection is deterministic in a contenteditable).
  await page.keyboard.press('Control+a');
  await page.getByRole('button', { name: 'Bold' }).click();
  await expect(editorBody(page).locator('strong', { hasText: 'Visit' })).toBeVisible();

  // Render half: the seeded rich thread shows bold, a real bullet, and a safe new-tab link.
  await page.goto(`/threads/${seed.threadRichId}`);
  await expect(page.locator('.thread-rich strong', { hasText: 'bold' })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.thread-rich li').first()).toBeVisible();
  const link = page.locator('.thread-rich a[href="https://example.com"]');
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveText('example.com'); // tidied display; href stays full
});

test('AC7 editing a thread reopens the editor with formatting; adding strikethrough renders on the page', async ({ page }) => {
  const seed = readSeed();

  await page.goto(`/threads/edit/${seed.threadEditId}`);
  // Reopened with the stored formatting intact.
  await expect(editorBody(page).locator('strong', { hasText: 'bold' })).toBeVisible({ timeout: 20_000 });

  // Add a word at the very end, then select exactly those 10 characters via the keyboard and strike them.
  await editorBody(page).click();
  await page.keyboard.press('Control+End');
  await editorBody(page).pressSequentially(' struckword');
  for (let i = 0; i < 'struckword'.length; i++) await page.keyboard.press('Shift+ArrowLeft');
  await page.getByRole('button', { name: 'Strikethrough' }).click();
  await expect(editorBody(page).locator('s', { hasText: 'struckword' })).toBeVisible();

  // Save, then visit the thread page (first visit -> fresh render) and confirm the change.
  await page.getByRole('button', { name: /^Update$/ }).click();
  await page.goto(`/threads/${seed.threadEditId}`);
  await expect(page.locator('.thread-rich s', { hasText: 'struckword' })).toBeVisible({ timeout: 20_000 });
});

test('AC8 a legacy plain-text thread still renders its line breaks; the mobile toolbar is one tap-sized row', async ({ page }) => {
  const seed = readSeed();

  // Legacy plain text renders through the line-break path (both lines visible, no HTML-ification).
  await page.goto(`/threads/${seed.threadLegacyId}`);
  await expect(page.getByText('Legacy line one.')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('Legacy line two.')).toBeVisible();
  // It is NOT rendered through the rich container.
  await expect(page.locator('.thread-rich')).toHaveCount(0);

  // Mobile: the toolbar is one row of tap-sized (>=36px) buttons.
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/threads/new');
  const bold = page.getByRole('button', { name: 'Bold' });
  await expect(bold).toBeVisible({ timeout: 20_000 });
  const box = await bold.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(32);
  for (const name of ['Italic', 'Underline', 'Strikethrough', 'Bullet list', 'Numbered list', 'Undo', 'Redo']) {
    await expect(page.getByRole('button', { name })).toBeVisible();
  }
});

// ─── Tidied URL display (featureplans/threads-url-display.md) ─────────────────────────────────────

test('AC1 (url-display) tidyUrl strips scheme/www, never cuts the domain, and caps at the 60-char budget', () => {
  expect(tidyUrl('https://desify.com.au')).toBe('desify.com.au');
  expect(tidyUrl('https://www.example.com/path')).toBe('example.com/path');
  expect(tidyUrl('https://desify.com.au/events')).toBe('desify.com.au/events'); // fits -> no dots
  expect(tidyUrl('http://foo.com/bar')).toBe('foo.com/bar');                    // scheme-agnostic display

  // Long path: domain intact, ends with "...", total exactly the budget, scheme gone.
  const long = 'https://desify.com.au/deals/view/abcdef1234567890/redeem-your-code-now-summer-2026';
  const t = tidyUrl(long);
  expect(t.startsWith('desify.com.au/deals/view')).toBeTruthy();
  expect(t.endsWith('...')).toBeTruthy();
  expect(t.length).toBe(60);
  expect(t).not.toContain('https://');

  // Over-budget domain: shown in FULL (rule 2 outranks the budget), path replaced by "...".
  expect(tidyUrl('https://' + 'a'.repeat(70) + '.com/some/path')).toBe('a'.repeat(70) + '.com...');

  // Query-string shape (raw href): scheme stripped, truncated with "...".
  const q = tidyUrl('https://x.io/p?v=1730000000000&campaign=spring-referral-longlonglonglong');
  expect(q.startsWith('x.io/p?v=')).toBeTruthy();
  expect(q).not.toContain('https://');
});

test('AC2 (url-display) a long URL renders tidied text while the href stays the complete URL', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/threads/${seed.threadUrlId}`);
  const link = page.locator('.thread-rich a').first();
  await expect(link).toBeVisible({ timeout: 20_000 });
  await expect(link).toHaveAttribute('href', /^https:\/\/desify\.com\.au\/deals\/view\/.*summer-2026$/);
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);
  const text = (await link.innerText()).trim();
  expect(text.startsWith('desify.com.au/deals/view')).toBeTruthy();
  expect(text.endsWith('...')).toBeTruthy();
  expect(text).not.toContain('https://');
});

test('AC3 (url-display) a short URL renders in full with no ellipsis', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/threads/${seed.threadRichId}`);
  await expect(page.locator('.thread-rich a[href="https://example.com"]')).toHaveText('example.com', { timeout: 20_000 });
});

test('AC4 (url-display) pasting a long URL shows tidied text live, and reopening the editor preserves it', async ({ page, context }) => {
  const seed = readSeed();
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  await page.goto('/threads/new');
  await expect(editorBody(page)).toBeVisible({ timeout: 20_000 });
  const longUrl = 'https://desify.com.au/deals/view/pasted1234567890/redeem-your-code-now-winter-2026';
  await editorBody(page).click();
  await page.evaluate((u) => navigator.clipboard.writeText(u), longUrl);
  await page.keyboard.press('Control+v');
  const pasted = editorBody(page).locator('a').first();
  await expect(pasted).toBeVisible();
  const pt = (await pasted.innerText()).trim();
  expect(pt.startsWith('desify.com.au/deals/view')).toBeTruthy();
  expect(pt.endsWith('...')).toBeTruthy();
  expect(pt).not.toContain('https://');

  // Reopen a stored long-link thread -> the editor shows the tidied text (preserved).
  await page.goto(`/threads/edit/${seed.threadUrlId}`);
  const reopened = editorBody(page).locator('a').first();
  await expect(reopened).toBeVisible({ timeout: 20_000 });
  const rt = (await reopened.innerText()).trim();
  expect(rt.startsWith('desify.com.au/deals/view')).toBeTruthy();
  expect(rt.endsWith('...')).toBeTruthy();
});

test('AC6 (url-display) a typed http URL stays plain text; an https URL autolinks', async ({ page }) => {
  await page.goto('/threads/new');
  await expect(editorBody(page)).toBeVisible({ timeout: 20_000 });
  await editorBody(page).click();
  await editorBody(page).pressSequentially('http://insecure.example.com ');
  await expect(editorBody(page).locator('a')).toHaveCount(0); // http never links
  await editorBody(page).pressSequentially('https://secure.example.com ');
  await expect(editorBody(page).locator('a', { hasText: 'secure.example.com' })).toHaveCount(1);
});
