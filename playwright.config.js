import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Parse .env.test (no dotenv dependency) so the frontend webServer BUILDS and STARTS with the test
// values (NEXT_PUBLIC_* are inlined at build time).
function loadEnvTest() {
  const out = {};
  const file = path.resolve(process.cwd(), '.env.test');
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}
const testEnv = loadEnvTest();

const BACKEND_DIR = path.resolve(process.cwd(), '..', 'ttbackendflyio');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1, // serial: the E2E backend shares one test DB (no per-test wipe)
  forbidOnly: true,
  retries: 0,
  timeout: 60_000,
  // On GitHub CI also annotate each failed test on the pull request.
  reporter: process.env.CI ? [['list'], ['github']] : [['list']],
  use: {
    baseURL: 'http://localhost:3120',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  },
  projects: [
    // Seeds the test DB and saves the member storage state. Everything else depends on it.
    { name: 'setup', testMatch: /global\.setup\.js/ },
    // Anonymous by default (guest/browse). Authenticated specs opt in via test.use({ storageState }).
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  webServer: [
    {
      // Backend in the isolated test env (loads .env.test + the three guards), listens on 5100.
      // Inline env (Linux) rather than cross-env, which isn't on PATH when Playwright spawns this.
      command: 'NODE_ENV=test node e2e-boot.js',
      cwd: BACKEND_DIR,
      port: 5100,
      reuseExistingServer: false,
      timeout: 60_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      // Frontend PRODUCTION build (into .next-e2e so the dev server's .next is untouched) on 3120.
      // GitHub CI builds in its own step first and sets E2E_SKIP_BUILD, so it only starts here.
      command: process.env.E2E_SKIP_BUILD ? 'npm run start:e2e' : 'npm run build:e2e && npm run start:e2e',
      url: 'http://localhost:3120',
      env: { ...testEnv, NEXT_DIST_DIR: '.next-e2e', NODE_OPTIONS: '--max-old-space-size=4096' },
      reuseExistingServer: false,
      timeout: 300_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
