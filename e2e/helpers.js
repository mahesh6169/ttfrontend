// Shared E2E helpers: read the seeded ids and verify DB state without adding any route to the
// served app (a backend script queries the same test DB in a separate process).
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

// Each ticket's pack tag id (null for singles) - to prove the N tickets of a pack share one id.
export function dbPackTags(eventId) {
  const out = introspect('packTags', eventId);
  const m = out.match(/PACKIDS=(\[.*\])/);
  if (!m) throw new Error(`introspect.js gave no PACKIDS for ${eventId}:\n${out}`);
  return JSON.parse(m[1]);
}
