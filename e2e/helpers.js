// Shared E2E helpers: read the seeded ids and verify DB state without adding any route to the
// served app (a backend script queries the same test DB in a separate process).
import { expect } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const BACKEND_DIR = path.resolve(process.cwd(), '..', 'ttbackendflyio');

export function readSeed() {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'e2e', '.auth', 'seed.json'), 'utf8'));
}

function introspect(kind, eventId) {
  return execSync(`node tests/introspect.js ${kind} ${eventId}`, {
    cwd: BACKEND_DIR,
    env: { ...process.env, NODE_ENV: 'test' },
  }).toString();
}

// Count docs for a model tied to an event, by running the backend introspection script.
export function dbCount(kind, eventId) {
  const out = introspect(kind, eventId);
  const m = out.match(/COUNT=(-?\d+)/);
  if (!m) throw new Error(`introspect.js gave no COUNT for ${kind} ${eventId}:\n${out}`);
  return parseInt(m[1], 10);
}

// Per-ticket base prices (refund maximum per ticket = basePrice) and paid prices for an event.
export function dbTicketPrices(eventId) {
  const out = introspect('ticketBasePrices', eventId);
  const base = out.match(/BASEPRICES=(\[.*\])/);
  const paid = out.match(/PAIDPRICES=(\[.*\])/);
  if (!base) throw new Error(`introspect.js gave no BASEPRICES for ${eventId}:\n${out}`);
  return { base: JSON.parse(base[1]), paid: paid ? JSON.parse(paid[1]) : [] };
}

// The invoice total for an event.
export function dbInvoiceTotal(eventId) {
  const out = introspect('invoiceTotal', eventId);
  const m = out.match(/TOTAL=(-?\d+(?:\.\d+)?)/);
  if (!m) throw new Error(`introspect.js gave no TOTAL for ${eventId}:\n${out}`);
  return parseFloat(m[1]);
}

// Capacity-consuming tickets sold for an event (each admission = 1).
export function dbSold(eventId) {
  const out = introspect('sold', eventId);
  const m = out.match(/SOLD=(-?\d+)/);
  if (!m) throw new Error(`introspect.js gave no SOLD for ${eventId}:\n${out}`);
  return parseInt(m[1], 10);
}

// The edit-locking signals set at first sale: { hasActivity, hasSold } (events-edit-locking.md AC1).
export function dbEditFlags(eventId) {
  const out = introspect('editFlags', eventId);
  const a = out.match(/HASACTIVITY=(\d)/);
  const s = out.match(/HASSOLD=(\d)/);
  if (!a || !s) throw new Error(`introspect.js gave no edit flags for ${eventId}:\n${out}`);
  return { hasActivity: a[1] === '1', hasSold: s[1] === '1' };
}

// Each ticket's pack tag id (null for singles) - to prove the N tickets of a pack share one id.
export function dbPackTags(eventId) {
  const out = introspect('packTags', eventId);
  const m = out.match(/PACKIDS=(\[.*\])/);
  if (!m) throw new Error(`introspect.js gave no PACKIDS for ${eventId}:\n${out}`);
  return JSON.parse(m[1]);
}

// ---------------------------------------------------------------------------------------------
// Browser helpers shared by the event specs (moved here from the per-spec copies).

export const API = 'http://localhost:5100/api';
export const KEY = { 'x-api-key': 'test-api-key' };

// Start from a clean slate: delete the member's leftover reservation (if any) for an event.
export async function clearReservation(page, eventId) {
  const res = await page.request.get(`${API}/events/${eventId}/reservation`, { headers: KEY });
  if (res.ok()) {
    const body = await res.json();
    if (body?.reservation?._id) {
      await page.request.delete(`${API}/events/${eventId}/reservation/${body.reservation._id}`, { headers: KEY });
    }
  }
}

// Open the edit wizard for an event (as its organiser) and wait for Step 1.
export async function openEdit(page, id) {
  await page.goto(`/events/edit/${id}`);
  await expect(page.getByPlaceholder('Enter event title')).toBeVisible({ timeout: 20_000 });
}

// Reach the seats page with `qty` Standard tickets held.
export async function openSeats(page, eventId, qty = 1) {
  await page.goto(`/events/tickets/${eventId}`);
  for (let i = 0; i < qty; i++) {
    await page.getByRole('button', { name: 'Add one Standard' }).click();
  }
  await expect(page.getByText(new RegExp(`${qty} ticket${qty === 1 ? '' : 's'} selected`)))
    .toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Select Seats' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/seats/${eventId}`), { timeout: 15_000 });
  await expect(page.getByTestId('stage-bar')).toBeVisible({ timeout: 20_000 });
}

// Reach the checkout of a NON-seated paid event with `qty` Standard tickets.
export async function gotoCheckoutNonSeated(page, eventId, qty = 1) {
  await page.goto(`/events/tickets/${eventId}`);
  for (let i = 0; i < qty; i++) {
    await page.getByRole('button', { name: 'Add one Standard' }).click();
  }
  await expect(page.getByText(new RegExp(`${qty} ticket${qty === 1 ? '' : 's'} selected`))).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Purchase Tickets' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/checkout/${eventId}`), { timeout: 15_000 });
}

// Fill the checkout buyer details and tick every consent checkbox.
export async function fillBuyer(page, email = 'buyer-e2e@test.dev') {
  await page.getByPlaceholder('First name').fill('Buyer');
  await page.getByPlaceholder('Last name').fill('Tester');
  await page.getByPlaceholder('Email address').fill(email);
  await page.getByPlaceholder('Phone number').fill('0412345678');
  for (const cb of await page.getByRole('checkbox').all()) {
    await cb.check().catch(() => {});
  }
}

// On the checkout Payment step: fill Stripe's 4242 test card (single CardElement iframe), pay, and
// wait for the success screen.
export async function payWith4242(page) {
  const stripe = page.frameLocator('iframe[title="Secure card payment input frame"]');
  await stripe.getByPlaceholder('Card number').fill('4242 4242 4242 4242');
  await stripe.getByPlaceholder('MM / YY').fill('12 / 34');
  await stripe.getByPlaceholder('CVC').fill('123');
  await stripe.getByPlaceholder(/ZIP|Postal/).fill('2000').catch(() => {});

  await page.getByRole('button', { name: /Complete Payment/ }).click();
  await expect(page.getByText('Payment Successful!')).toBeVisible({ timeout: 45_000 });
}
