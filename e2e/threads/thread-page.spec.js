// Feature 1012 - reading a blog-style thread: content in the written order, picture sets (arrows on
// desktop, swipe on phones), the full-screen viewer, the author name, the chat switch, and admin
// moderation (category + chat only). A new file because rich-editor.spec.js covers writing in the
// editor, while these are the thread page and admin journeys. Seeded threads: ttbackendflyio
// tests/seed-e2e.js (threadBlogId, threadChatOffId, threadModerateId).
import { test, expect } from '@playwright/test';
import { readSeed, API, KEY } from '../helpers.js';

test.use({ storageState: 'e2e/.auth/member.json' });

const post = (page) => page.getByTestId('thread-post');
const top = async (locator) => (await locator.boundingBox()).y;

test('a blog-style post shows headings, links, a picture and a picture set in the written order, under the author name', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/threads/${seed.threadBlogId}`);
  await expect(post(page).locator('h2', { hasText: 'Stop one' })).toBeVisible({ timeout: 20_000 });

  // Same order as written: heading, single picture, subheading, picture set, closing words.
  const h2 = post(page).locator('h2', { hasText: 'Stop one' });
  const single = post(page).getByTestId('picture-single');
  const h3 = post(page).locator('h3', { hasText: 'Getting there' });
  const set = post(page).getByTestId('picture-set');
  const closing = post(page).getByText('Closing words.');
  const ys = [await top(h2), await top(single), await top(h3), await top(set), await top(closing)];
  expect([...ys].sort((a, b) => a - b)).toEqual(ys);

  // The Google Maps link has the pin; a normal link does not. Both open in a new tab.
  const map = post(page).locator('a', { hasText: 'the place' });
  await expect(map).toHaveClass(/map-link/);
  await expect(map).toHaveAttribute('target', '_blank');
  await expect(post(page).locator('a', { hasText: 'our menu' })).not.toHaveClass(/map-link/);

  // The author name (not the account name) is shown in the About card; there is no "Posted By"
  // line, and the old top photo gallery is gone.
  await expect(page.getByTestId('thread-author-name').first()).toHaveText('Ravi Kumar');
  await expect(page.getByText('Posted By:')).toHaveCount(0);
  await expect(page.getByText('Click for full view')).toHaveCount(0);
});

test('a picture set moves with the arrows and dots on desktop and by swiping on a phone', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/threads/${seed.threadBlogId}`);
  const set = page.getByTestId('picture-set');
  const counter = set.getByTestId('picture-set-counter');
  await expect(counter).toHaveText('1 / 3', { timeout: 20_000 });

  await set.getByRole('button', { name: 'Next picture' }).click();
  await expect(counter).toHaveText('2 / 3');
  await set.getByRole('button', { name: 'Show picture 3' }).click();
  await expect(counter).toHaveText('3 / 3');
  await set.getByRole('button', { name: 'Previous picture' }).click();
  await expect(counter).toHaveText('2 / 3');

  // Phone: no arrows; a swipe (the set scrolls sideways) moves to the next picture.
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(`/threads/${seed.threadBlogId}`);
  const phoneSet = page.getByTestId('picture-set');
  await expect(phoneSet.getByTestId('picture-set-counter')).toHaveText('1 / 3', { timeout: 20_000 });
  await expect(phoneSet.getByRole('button', { name: 'Next picture' })).toBeHidden();
  await phoneSet.locator('.snap-x').evaluate((el) => el.scrollTo({ left: el.clientWidth, behavior: 'instant' }));
  await expect(phoneSet.getByTestId('picture-set-counter')).toHaveText('2 / 3');
});

test('the full-screen viewer opens on a picture, zooms, moves through every picture and closes with Esc, X or Back', async ({ page }) => {
  const seed = readSeed();
  const url = `/threads/${seed.threadBlogId}`;
  await page.goto(url);
  const viewer = page.getByTestId('picture-viewer');

  await page.getByRole('button', { name: 'Open picture 1 full screen' }).click({ timeout: 20_000 });
  await expect(viewer).toBeVisible();
  await expect(viewer).toContainText('1 of 4'); // all pictures in the post, not just one set
  await page.keyboard.press('ArrowRight');
  await expect(viewer).toContainText('2 of 4');
  await viewer.getByRole('button', { name: 'Zoom in' }).click();
  await expect(viewer.locator('img')).toHaveAttribute('style', /scale\(1\.5\)/);
  await page.keyboard.press('Escape');
  await expect(viewer).toBeHidden();

  await page.getByRole('button', { name: 'Open picture 1 full screen' }).click();
  await viewer.getByRole('button', { name: 'Close' }).click();
  await expect(viewer).toBeHidden();

  // The browser / phone Back button closes the viewer and stays on the thread.
  await page.getByRole('button', { name: 'Open picture 1 full screen' }).click();
  await expect(viewer).toBeVisible();
  await page.goBack();
  await expect(viewer).toBeHidden();
  expect(page.url()).toContain(url);
});

test('with chat turned off the post shows a note instead of the chat, and the server refuses messages', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/threads/${seed.threadChatOffId}`);
  await expect(page.getByTestId('chat-off-note')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#conversation-area')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Comment' })).toHaveCount(0);

  const res = await page.request.post(`${API}/threads/send`, {
    headers: KEY,
    data: { threadId: seed.threadChatOffId, message: 'should be refused' },
  });
  expect(res.status()).toBe(403);
});

test.describe('admin moderation', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('an admin can change the category and turn chat off on someone else\'s thread, but not edit its words', async ({ page }) => {
    const seed = readSeed();
    await page.goto(`/admin/profile/threads/edit/${seed.threadModerateId}`);
    await expect(page.getByTestId('moderate-title')).toHaveText('E2E Moderate Thread', { timeout: 20_000 });
    // Not the admin's own thread: no way to edit the words here.
    await expect(page.getByRole('link', { name: 'Edit full post' })).toHaveCount(0);

    await page.getByLabel('Category').selectOption('Coming Soon & New Openings');
    await page.getByLabel(/Allow group chat on this post/).uncheck();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Saved.')).toBeVisible();

    await page.goto(`/threads/${seed.threadModerateId}`);
    await expect(page.getByText('Coming Soon & New Openings')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('chat-off-note')).toBeVisible();
    await expect(page.getByText('Words only the writer may change.')).toBeVisible();
  });
});
