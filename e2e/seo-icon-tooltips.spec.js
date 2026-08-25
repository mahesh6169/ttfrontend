// featureplans/fix-shared-seo-icon-tooltips.md
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

test('AC2 /events SSR HTML has no wishlist title= and has aria-label="Add to Wishlist"', async ({ request }) => {
  const res = await request.get('/events');
  const html = await res.text();
  expect(html).not.toContain('title="Add to Wishlist"');
  expect(html).not.toContain('title="Remove from Wishlist"');
  expect(html).toContain('aria-label="Add to Wishlist"');
});

test('AC3 /listings SSR HTML has no wishlist title= and has aria-label="Add to Wishlist"', async ({ request }) => {
  const res = await request.get('/listings');
  const html = await res.text();
  expect(html).not.toContain('title="Add to Wishlist"');
  expect(html).not.toContain('title="Remove from Wishlist"');
  expect(html).toContain('aria-label="Add to Wishlist"');
});

test('AC4 /coupons SSR HTML has no title="Share" and retains aria-label="Share"', async ({ request }) => {
  const res = await request.get('/coupons');
  const html = await res.text();
  expect(html).not.toContain('title="Share"');
  expect(html).toContain('aria-label="Share"');
});

test('AC5 homepage SSR HTML has no header Signin/Register/nav-link title= strings', async ({ request }) => {
  const res = await request.get('/');
  const html = await res.text();
  expect(html).not.toContain('title="Signin"');
  expect(html).not.toContain('title="Register"');
  expect(html).not.toContain('title="Events"');
  expect(html).not.toContain('title="Listings"');
  expect(html).not.toContain('title="Deals"');
  expect(html).not.toContain('title="Coupons"');
  expect(html).not.toContain('title="Forum"');
  expect(html).not.toContain('title="Home"');
});
