// Shared E2E helpers: read the seeded ids and verify DB state without adding any route to the
// served app (a backend script queries the same test DB in a separate process).
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const BACKEND_DIR = path.resolve(process.cwd(), '..', 'ttbackendflyio');

export function readSeed() {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'e2e', '.auth', 'seed.json'), 'utf8'));
}

// Count docs for a model tied to an event, by running the backend introspection script.
export function dbCount(kind, eventId) {
  const out = execSync(`node tests/introspect.js ${kind} ${eventId}`, {
    cwd: BACKEND_DIR,
    env: { ...process.env, NODE_ENV: 'test' },
  }).toString();
  const m = out.match(/COUNT=(-?\d+)/);
  if (!m) throw new Error(`introspect.js gave no COUNT for ${kind} ${eventId}:\n${out}`);
  return parseInt(m[1], 10);
}
