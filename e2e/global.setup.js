// Playwright setup project: seed the test DB (via the backend seed script) and save a logged-in
// member storage state that authenticated specs reuse. Runs after the webServers are up.
import { test as setup, expect } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BACKEND_DIR = path.resolve(process.cwd(), '..', 'ttbackendflyio');
const AUTH_DIR = path.resolve(process.cwd(), 'e2e', '.auth');
const BACKEND_URL = 'http://localhost:5100';

setup('seed test data and authenticate the member', async ({ request }) => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  // 1. Seed: drops the test DB and creates organiser + member + free/paid events.
  const out = execSync('node tests/seed-e2e.js', {
    cwd: BACKEND_DIR,
    env: { ...process.env, NODE_ENV: 'test' },
  }).toString();
  const line = out.split('\n').find((l) => l.startsWith('SEED_JSON='));
  if (!line) throw new Error(`Seed script did not emit SEED_JSON. Output:\n${out}`);
  const seed = JSON.parse(line.replace('SEED_JSON=', ''));
  fs.writeFileSync(path.join(AUTH_DIR, 'seed.json'), JSON.stringify(seed, null, 2));

  // The seed drops + recreates the DB with fresh ids. Next's persistent data cache
  // (.next-e2e/cache/fetch-cache) holds the prior run's SSR fetches - e.g. the /events
  // landing pre-fill (revalidate 300) - so without this the first requests would serve
  // last run's now-deleted event ids and any clicked card would 404. Clear it so SSR
  // reflects this run's seed.
  fs.rmSync(path.resolve(process.cwd(), '.next-e2e', 'cache', 'fetch-cache'), {
    recursive: true,
    force: true,
  });

  // The homepage (/) has no searchParams, so Next STATICALLY prerenders it at build time -
  // which happens before this seed runs, baking an empty-rails HTML. Delete that prerender so
  // Next regenerates / on the first request with the seeded data (its rails are the only SSR
  // content that must reflect the current DB). Prod is unaffected (it builds after data exists).
  for (const f of ['index.html', 'index.rsc', 'index.meta']) {
    fs.rmSync(path.resolve(process.cwd(), '.next-e2e', 'server', 'app', f), { force: true });
  }

  // 2. Log the member in (public endpoint, no API key) and save the cookie as storage state.
  const res = await request.post(`${BACKEND_URL}/api/users/login`, {
    data: { email: seed.memberEmail, password: seed.memberPassword },
  });
  expect(res.ok()).toBeTruthy();
  await request.storageState({ path: path.join(AUTH_DIR, 'member.json') });

  // 3. Log the organiser in (owns the seat-builder events) and save a second storage state. The later
  // login overwrites the token cookie, so member.json (saved above) keeps the member session.
  const orgRes = await request.post(`${BACKEND_URL}/api/users/login`, {
    data: { email: seed.organiserEmail, password: seed.organiserPassword },
  });
  expect(orgRes.ok()).toBeTruthy();
  await request.storageState({ path: path.join(AUTH_DIR, 'organiser.json') });
});
