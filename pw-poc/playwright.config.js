// DIA API automation: Playwright Test + APIRequestContext only (JavaScript, no browser, no UI). Run from the repo root:
//   npm run test:api
const { defineConfig } = require('@playwright/test');
const path = require('path');

// ---- Configuration ---------------------------------------------------------------------------------------------------
// Source of truth: environment variables (DIA_BASE_URL, DIA_USERNAME, DIA_PASSWORD, DIA_MAX_RESPONSE_MS and, optionally,
// DIA_VIEWER_USERNAME / DIA_VIEWER_PASSWORD for the role-based tests). Put them in the shell, in CI secrets, or in a
// gitignored pw-poc/.env file (see pw-poc/.env.example). Real environment variables always win over .env.
try {
  process.loadEnvFile(path.join(__dirname, '.env')); // Node built-in loader: no extra dependency, never overrides existing variables
} catch {
  /* no .env file: that is fine */
}

// Sensible defaults for the two optional variables. Assigning `undefined` to process.env would store the string "undefined",
// so a variable is only filled when it is unset.
process.env.DIA_BASE_URL ||= 'http://localhost:8081';
process.env.DIA_MAX_RESPONSE_MS ||= '3000';

// The consolidated endpoint report (served at http://localhost:9400, see README) is only produced by `npm run test:report`
// (DIA_CONSOLIDATED_REPORT=1). A plain `npm test` behaves exactly as before.
const reporters = [
  ['list'],
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ['junit', { outputFile: 'results/junit.xml' }],
];
if (process.env.DIA_CONSOLIDATED_REPORT === '1') reporters.push([path.join(__dirname, 'reporters', 'consolidated-reporter.js')]);

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // API tests are deterministic; a retry should be the exception
  workers: process.env.CI ? 2 : 4,
  reporter: reporters,
  use: { baseURL: process.env.DIA_BASE_URL, trace: 'retain-on-failure' }, // trace archive only for tests that fail unexpectedly
});
