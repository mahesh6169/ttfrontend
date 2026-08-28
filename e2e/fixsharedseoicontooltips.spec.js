// featureplans/fix-shared-seo-icon-tooltips.md (expanded)
import { test, expect } from '@playwright/test';

test('AC1 /events SSR HTML has no event-type icon title= strings', async ({ request }) => {
  const res = await request.get('/events');
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).not.toContain('title="Recurring Event"');
  expect(html).not.toContain('title="Promotional Event"');
  expect(html).not.toContain('title="Paid Event"');
  expect(html).not.toContain('title="RSVP"');
  expect(html).not.toContain('title="External tickets"');
});

test('AC2 /listings SSR HTML has no Location or Follow-us title= strings', async ({ request }) => {
  const res = await request.get('/listings');
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).not.toContain('title="Location"');
  expect(html).not.toContain('title="Follow us"');
});

test('AC3 /coupons SSR HTML has no title="Share" and retains aria-label="Share"', async ({ request }) => {
  const res = await request.get('/coupons');
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).not.toContain('title="Share"');
  expect(html).toContain('aria-label="Share"');
});

test('AC4 /events SSR HTML has no Header Messages/Menu/Signout title= strings', async ({ request }) => {
  const res = await request.get('/events');
  const html = await res.text();
  expect(html).not.toContain('title="Messages"');
  expect(html).not.toContain('title="Menu"');
  expect(html).not.toContain('title="Signout"');
});

test('AC5 wishlist buttons carry aria-label= and no title= on /events and /listings', async ({ request }) => {
  const evRes = await request.get('/events');
  const evHtml = await evRes.text();
  expect(evHtml).not.toContain('title="Add to Wishlist"');
  expect(evHtml).not.toContain('title="Remove from Wishlist"');
  expect(evHtml).toContain('aria-label="Add to Wishlist"');

  const adRes = await request.get('/listings');
  const adHtml = await adRes.text();
  expect(adHtml).not.toContain('title="Add to Wishlist"');
  expect(adHtml).not.toContain('title="Remove from Wishlist"');
  expect(adHtml).toContain('aria-label="Add to Wishlist"');
});
