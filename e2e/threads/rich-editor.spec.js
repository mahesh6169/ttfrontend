// Thread rich-text editor browser journeys - see featureplans/threads-rich-editor.md and
// featureplans/threads-url-display.md. Creating a thread from scratch needs the Google Places
// suburb picker (not scriptable), so the editor's live behaviour is exercised on /threads/new, and
// the create/edit RENDER is proven against seeded threads (the edit thread is first visited after
// its edit, so the ISR page is fresh). The pure tidyUrl checks are in e2e/unit/pure-utils.spec.js.
import { test, expect } from '@playwright/test';
import { readSeed } from '../helpers.js';

test.use({ storageState: 'e2e/.auth/member.json' });

const editorBody = (page) => page.locator('.thread-editor-content');

// The Link/Map box's own error line (Next.js also has a hidden role="alert" route announcer).
const linkError = (page) => page.locator('p[role="alert"]');

// Select the last n characters typed (keyboard selection is deterministic in a contenteditable).
const selectBack = async (page, n) => {
  for (let i = 0; i < n; i++) await page.keyboard.press('Shift+ArrowLeft');
};

// Feature 1012 picture upload: answer the upload call in the browser so no real Cloudinary upload
// happens in CI. CORS headers are needed because the API is on another origin.
const PIC_URL = 'https://res.cloudinary.com/dtvrbdvkx/image/upload/v1764066113/ogshare_v4_psldb7.jpg';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const pngFile = (name) => ({ name, mimeType: 'image/png', buffer: PNG });
const mockPictureUpload = async (page) => {
  await page.route('**/threads/pictures', async (route) => {
    const req = route.request();
    const headers = {
      'Access-Control-Allow-Origin': req.headers().origin || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': req.headers()['access-control-request-headers'] || 'content-type,x-api-key',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    return route.fulfill({
      status: 201,
      headers,
      contentType: 'application/json',
      body: JSON.stringify({ url: PIC_URL, publicId: 'tagtelugudev/threads/e2e', width: 1200, height: 630 }),
    });
  });
};

test('the editor auto-links typed https URLs (never http) and bolds text; a rich thread renders formatting and a safe link', async ({ page }) => {
  const seed = readSeed();

  // Editor half: on /threads/new, a typed http URL stays plain text; an https URL autolinks.
  await page.goto('/threads/new');
  await expect(editorBody(page)).toBeVisible({ timeout: 20_000 });
  await editorBody(page).click();
  await editorBody(page).pressSequentially('http://insecure.example.com ');
  await expect(editorBody(page).locator('a')).toHaveCount(0); // http never links
  await editorBody(page).pressSequentially('https://secure.example.com ');
  await expect(editorBody(page).locator('a', { hasText: 'secure.example.com' })).toHaveCount(1);

  // On a fresh editor, typing a URL then a space auto-links it. The link's visible text is the
  // tidied display (scheme stripped); the href stays the full URL.
  await page.goto('/threads/new');
  await expect(editorBody(page)).toBeVisible({ timeout: 20_000 });
  await editorBody(page).click();
  await editorBody(page).pressSequentially('Visit https://typed.example.com ');
  const liveLink = editorBody(page).locator('a', { hasText: 'typed.example.com' });
  await expect(liveLink).toBeVisible();

  // Toolbar: select all and bold it (keyboard selection is deterministic in a contenteditable).
  await page.keyboard.press('Control+a');
  await page.getByRole('button', { name: 'Bold' }).click();
  await expect(editorBody(page).locator('strong', { hasText: 'Visit' })).toBeVisible();

  // Render half: the seeded rich thread shows bold, a real bullet, and a safe new-tab link whose
  // short URL is shown in full with no ellipsis.
  await page.goto(`/threads/${seed.threadRichId}`);
  await expect(page.locator('.thread-rich strong', { hasText: 'bold' })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.thread-rich li').first()).toBeVisible();
  const link = page.locator('.thread-rich a[href="https://example.com"]');
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveText('example.com'); // tidied display; href stays full
});

test('editing a thread reopens the editor with its formatting; adding strikethrough renders on the page', async ({ page }) => {
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

  // Feature 1012: a Map link on new words gets the map pin on the saved page.
  await page.keyboard.press('End');
  await editorBody(page).pressSequentially(' meet here');
  await selectBack(page, 'meet here'.length);
  await page.getByRole('button', { name: 'Map' }).click();
  await page.getByLabel('Google Maps link').fill('maps.google.com/?q=Parramatta');
  await page.getByRole('button', { name: 'Save link' }).click();

  // Save, then visit the thread page (first visit -> fresh render) and confirm the change.
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: /^Update$/ }).click();
  await page.goto(`/threads/${seed.threadEditId}`);
  await expect(page.locator('.thread-rich s', { hasText: 'struckword' })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.thread-rich a.map-link', { hasText: 'meet here' })).toHaveAttribute('href', 'https://maps.google.com/?q=Parramatta');
});

test('a legacy plain-text thread still renders its line breaks; the mobile toolbar shows every button', async ({ page }) => {
  const seed = readSeed();

  // Legacy plain text renders through the line-break path (both lines visible, no HTML-ification).
  await page.goto(`/threads/${seed.threadLegacyId}`);
  await expect(page.getByText('Legacy line one.')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('Legacy line two.')).toBeVisible();
  // It is NOT rendered through the rich container.
  await expect(page.locator('.thread-rich')).toHaveCount(0);

  // Mobile: every toolbar button is visible.
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/threads/new');
  await expect(page.getByRole('button', { name: 'Bold' })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByLabel('Text style')).toBeVisible();
  for (const name of ['Italic', 'Underline', 'Strikethrough', 'Bullet list', 'Numbered list', 'Link', 'Map', 'Picture', 'Undo', 'Redo']) {
    await expect(page.getByRole('button', { name })).toBeVisible();
  }
});

test('long URLs show tidied text while the href stays complete - on a thread page, when pasted, and when the editor is reopened', async ({ page, context }) => {
  const seed = readSeed();

  // On the thread page: tidied text, complete href, safe new-tab link.
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

  // Pasting a long URL in the editor shows the tidied text live.
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


// ---------------------------------------------------------------------------------------------
// Feature 1012 - blog-style posts in the editor.
// ---------------------------------------------------------------------------------------------

test('the editor makes headings, puts links on chosen words (https only) and Google Maps links on the Map button', async ({ page }) => {
  await page.goto('/threads/new');
  await expect(editorBody(page)).toBeVisible({ timeout: 20_000 });

  // Heading and Subheading from the text style menu.
  await editorBody(page).click();
  await editorBody(page).pressSequentially('Stop one');
  await page.getByLabel('Text style').selectOption('h2');
  await expect(editorBody(page).locator('h2', { hasText: 'Stop one' })).toBeVisible();
  await page.keyboard.press('Enter');
  await editorBody(page).pressSequentially('Getting there');
  await page.getByLabel('Text style').selectOption('h3');
  await expect(editorBody(page).locator('h3', { hasText: 'Getting there' })).toBeVisible();
  await page.keyboard.press('Enter');
  await page.getByLabel('Text style').selectOption('p');

  // Link on the writer's own words: "google.com" gets https:// added; the words stay as written.
  await editorBody(page).pressSequentially('Search: click here');
  await selectBack(page, 'click here'.length);
  await page.getByRole('button', { name: 'Link' }).click();
  await page.getByLabel('Link address').fill('google.com');
  await page.getByRole('button', { name: 'Save link' }).click();
  const named = editorBody(page).locator('a', { hasText: 'click here' });
  await expect(named).toHaveAttribute('href', /^https:\/\/google\.com/);
  await expect(named).toHaveText('click here');

  // An http:// address is refused.
  await page.keyboard.press('End');
  await editorBody(page).pressSequentially(' and old site');
  await selectBack(page, 'old site'.length);
  await page.getByRole('button', { name: 'Link' }).click();
  await page.getByLabel('Link address').fill('http://example.com');
  await page.getByRole('button', { name: 'Save link' }).click();
  await expect(linkError(page)).toContainText('https://');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('link-box')).toHaveCount(0);
  await expect(editorBody(page).locator('a', { hasText: 'old site' })).toHaveCount(0);

  // Map button: only Google Maps links are accepted.
  await editorBody(page).click();
  await page.keyboard.press('Control+End');
  await editorBody(page).pressSequentially(' near the place');
  await selectBack(page, 'the place'.length);
  await page.getByRole('button', { name: 'Map' }).click();
  await page.getByLabel('Google Maps link').fill('https://example.com');
  await page.getByRole('button', { name: 'Save link' }).click();
  await expect(linkError(page)).toContainText('Google Maps');
  await page.getByLabel('Google Maps link').fill('https://maps.app.goo.gl/e2eAbc');
  await page.getByRole('button', { name: 'Save link' }).click();
  await expect(editorBody(page).locator('a[href="https://maps.app.goo.gl/e2eAbc"]')).toHaveText('the place');
});

test('with nothing highlighted, Link and Map add the link at the cursor; a highlighted address fills the box; clicking a link edits it', async ({ page }) => {
  await page.goto('/threads/new');
  await expect(editorBody(page)).toBeVisible({ timeout: 20_000 });
  await editorBody(page).click();

  // A highlighted web address fills the box, so Enter is enough.
  await editorBody(page).pressSequentially('www.example.org');
  await page.keyboard.press('ControlOrMeta+a');
  await page.getByRole('button', { name: 'Link' }).click();
  await expect(page.getByLabel('Link address')).toHaveValue('https://www.example.org');
  await page.keyboard.press('Enter');
  await expect(editorBody(page).locator('a[href="https://www.example.org"]')).toHaveCount(1);
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.press('Enter');

  await editorBody(page).pressSequentially('Visit ');

  // Nothing highlighted: the small box opens at the cursor and the address goes in as a link.
  await page.getByRole('button', { name: 'Link' }).click();
  await expect(page.getByTestId('link-box')).toBeVisible();
  await page.getByLabel('Link address').fill('example.com/menu');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('link-box')).toHaveCount(0);
  await expect(editorBody(page).locator('a[href="https://example.com/menu"]')).toHaveCount(1);
  // Words typed after it are normal text.
  await editorBody(page).pressSequentially(' today');
  await expect(editorBody(page).locator('a', { hasText: 'today' })).toHaveCount(0);

  // Map with nothing highlighted adds "View on map" with the pin link.
  await editorBody(page).pressSequentially(' - ');
  await page.getByRole('button', { name: 'Map' }).click();
  await page.getByLabel('Google Maps link').fill('maps.app.goo.gl/e2eCursor');
  await page.getByRole('button', { name: 'Save link' }).click();
  await expect(editorBody(page).locator('a[href="https://maps.app.goo.gl/e2eCursor"]')).toHaveText('View on map');


  // Clicking an existing link opens the same box with its address, and it can be removed.
  await editorBody(page).locator('a[href="https://example.com/menu"]').click();
  await expect(page.getByLabel('Link address')).toHaveValue('https://example.com/menu');
  await page.getByRole('button', { name: 'Remove link' }).click();
  await expect(editorBody(page).locator('a[href="https://example.com/menu"]')).toHaveCount(0);
});

test('the Picture button adds several pictures as one set where the cursor is, and stops at 10 pictures', async ({ page }) => {
  await mockPictureUpload(page);
  await page.goto('/threads/new');
  await expect(editorBody(page)).toBeVisible({ timeout: 20_000 });
  // The old photo box at the bottom of the form is gone.
  await expect(page.getByText('Upload Images')).toHaveCount(0);

  await editorBody(page).click();
  await editorBody(page).pressSequentially('Before the pictures');
  await page.locator('[data-testid="thread-picture-input"]').setInputFiles([pngFile('a.png'), pngFile('b.png')]);
  const block = page.locator('[data-testid="editor-picture-block"]');
  await expect(block).toHaveCount(1, { timeout: 15_000 });
  await expect(block.locator('img')).toHaveCount(2);
  await expect(page.getByText('Pictures: 2/10')).toBeVisible();

  // Removing one leaves a single picture.
  await block.getByRole('button', { name: 'Remove picture 2' }).click();
  await expect(block.locator('img')).toHaveCount(1);

  // Adding more than the 10-picture limit is refused with a message.
  const many = Array.from({ length: 10 }, (_, i) => pngFile(`m${i}.png`));
  await page.locator('[data-testid="thread-picture-input"]').setInputFiles(many);
  await expect(page.getByText(/up to 10 pictures/)).toBeVisible();
  await expect(page.getByText('Pictures: 1/10')).toBeVisible();
});

test('creating a thread is two steps: write (title + post) first, then the details; Back keeps the writing', async ({ page }) => {
  await page.goto('/threads/new');
  await expect(page.getByTestId('thread-step-write')).toBeVisible({ timeout: 20_000 });

  // Next needs a title and a post.
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('Please add a title.').first()).toBeVisible();
  await expect(page.getByLabel('Category')).toHaveCount(0);

  await page.getByLabel('Title').fill('My two step post');
  await editorBody(page).click();
  await editorBody(page).pressSequentially('The words come first.');
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Step 2: the details, under the post's title.
  await expect(page.getByTestId('thread-details-title')).toHaveText('My two step post');
  await expect(page.getByText(/Allow group chat on this post/)).toBeVisible();
  await expect(editorBody(page)).toHaveCount(0);

  // Back keeps everything.
  await page.getByRole('button', { name: /Back$/ }).click();
  await expect(page.getByLabel('Title')).toHaveValue('My two step post');
  await expect(editorBody(page)).toContainText('The words come first.');
});
