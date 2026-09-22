#!/usr/bin/env node
/**
 * newman/generate-report.js
 *
 * Turns a Newman JSON reporter export (newman/reports/report-*.json) into a
 * single, self-contained, human-readable HTML test report.
 *
 * Design goal: the JSON export is treated purely as input data. The report
 * never surfaces raw Postman/Newman JSON, request/response headers or
 * bodies, collection metadata (IDs, schema URLs), or environment secrets
 * (username/password/access_token). Only interpreted, QA-friendly results
 * are shown: which test cases ran, grouped by feature, with pass/fail
 * status, timing, and (for failures) the assertion that broke and why.
 *
 * Usage:
 *   node newman/generate-report.js [path/to/report.json] [path/to/output.html]
 *
 * With no arguments:
 *   - reads the most recently modified newman/reports/report-*.json
 *   - writes <same-name>.html next to it
 *   - also refreshes newman/reports/latest.html, a stable filename you can
 *     always open without knowing the latest timestamp
 *
 * This script has no npm dependencies of its own (only Node's built-in
 * `fs`/`path`), so it needs nothing beyond what running the tests already
 * requires -- safe to drop into any CI job right after the Newman run.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------
// 1. Locate input/output files
// ---------------------------------------------------------------------

const REPORTS_DIR = path.join(__dirname, 'reports');

function findLatestReport(reportsDir) {
  const candidates = fs
    .readdirSync(reportsDir)
    .filter((f) => /^report-.*\.json$/.test(f))
    .map((f) => ({ f, mtime: fs.statSync(path.join(reportsDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  if (candidates.length === 0) {
    throw new Error(
      `No Newman JSON reports found in ${reportsDir}.\n` +
        'Run the tests first, e.g.: ./newman/run-tests.sh'
    );
  }
  return path.join(reportsDir, candidates[0].f);
}

const inputArg = process.argv[2];
const outputArg = process.argv[3];

const inputPath = inputArg ? path.resolve(inputArg) : findLatestReport(REPORTS_DIR);
const outputPath = outputArg ? path.resolve(outputArg) : inputPath.replace(/\.json$/, '.html');

// ---------------------------------------------------------------------
// 2. Load the Newman JSON export and pull out ONLY what the report needs
// ---------------------------------------------------------------------

const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

/**
 * Walks the ORIGINAL collection tree (raw.collection.item) -- never the
 * per-execution items -- to map each request's id to its folder breadcrumb
 * and description. This matters: the collection tree still has unresolved
 * `{{username}}`-style placeholders, while the per-execution copies newman
 * attaches to each result have already substituted real environment values
 * (including credentials/tokens), so reading descriptions from there would
 * leak secrets straight into the "clean" report.
 */
function walkCollection(items, breadcrumb, map) {
  for (const it of items || []) {
    if (Array.isArray(it.item)) {
      walkCollection(it.item, breadcrumb.concat(it.name), map);
      continue;
    }
    const descRaw =
      (it.request && it.request.description && it.request.description.content) || '';
    map.set(it.id, {
      suite: breadcrumb[0] || 'Uncategorized',
      breadcrumb,
      description: sanitizeDescription(descRaw),
    });
  }
}

function sanitizeDescription(text) {
  return text
    .replace(/\{\{\s*username\s*\}\}/gi, 'test username')
    .replace(/\{\{\s*password\s*\}\}/gi, 'test password')
    .replace(/\{\{\s*access_token\s*\}\}/gi, 'session token')
    .replace(/\{\{\s*([\w.-]+)\s*\}\}/g, '$1') // any other placeholder: drop the braces only
    .replace(/\s+/g, ' ')
    .trim();
}

const requestMeta = new Map();
walkCollection((raw.collection && raw.collection.item) || [], [], requestMeta);

/** Reads exactly one, non-secret environment variable. Never touch anything
 * else in environment.values -- that array also holds the resolved
 * username/password/access_token in plain text. */
function getBaseUrl(environment) {
  const values = (environment && environment.values) || [];
  const found = values.find((v) => v.key === 'base_url');
  return found ? found.value : null;
}

function pathFromUrl(url) {
  if (!url) return '';
  const p = Array.isArray(url.path) ? '/' + url.path.join('/') : '';
  const query = (url.query || [])
    .filter((q) => q.key)
    .map((q) => `${q.key}=${q.value}`)
    .join('&');
  return query ? `${p}?${query}` : p;
}

function detectTool() {
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const pkg = require(path.join(process.cwd(), 'node_modules', 'newman', 'package.json'));
    return `Postman Collection Runner (Newman v${pkg.version})`;
  } catch (e) {
    return 'Postman Collection Runner (Newman)';
  }
}

// ---------------------------------------------------------------------
// 3. Build the clean per-test-case model
// ---------------------------------------------------------------------

const executions = (raw.run && raw.run.executions) || [];

const tests = executions.map((ex) => {
  const info = requestMeta.get(ex.item.id) || {
    suite: 'Uncategorized',
    breadcrumb: [ex.item.name],
    description: '',
  };
  const assertions = ex.assertions || [];
  const failedAssertions = assertions.filter((a) => a && a.error);
  const status = failedAssertions.length > 0 ? 'FAILED' : 'PASSED';
  const response = ex.response || {};

  return {
    name: ex.item.name,
    suite: info.suite,
    breadcrumb: info.breadcrumb,
    description: info.description,
    method: (ex.request && ex.request.method) || '',
    endpoint: pathFromUrl(ex.request && ex.request.url),
    statusCode: response.code,
    statusText: response.status,
    durationMs: typeof response.responseTime === 'number' ? response.responseTime : null,
    status,
    assertionsTotal: assertions.length,
    assertionsPassed: assertions.length - failedAssertions.length,
    failures: failedAssertions.map((a) => ({
      assertion: a.assertion || 'Assertion',
      message: (a.error && a.error.message) || 'Assertion failed.',
    })),
  };
});

// ---------------------------------------------------------------------
// 4. Aggregate: overall totals + per-suite rollups (all computed, none hardcoded)
// ---------------------------------------------------------------------

function rollUp(list) {
  const acc = { total: 0, passed: 0, failed: 0, skipped: 0 };
  for (const t of list) {
    acc.total += 1;
    if (t.status === 'PASSED') acc.passed += 1;
    else acc.failed += 1;
  }
  return acc;
}

const pct = (n, d) => (d === 0 ? 0 : Math.round((n / d) * 1000) / 10);

const totals = rollUp(tests);
// Newman reports "pending" test-items when a run is aborted early (e.g. a
// bail-on-failure run that never reached later requests) -- the closest
// native concept to "skipped".
totals.skipped = (raw.run && raw.run.stats && raw.run.stats.tests && raw.run.stats.tests.pending) || 0;
totals.total += totals.skipped;
totals.passPct = pct(totals.passed, totals.total);
totals.failPct = pct(totals.failed, totals.total);
totals.overallStatus = totals.failed > 0 ? 'FAILED' : 'PASSED';

const suiteOrder = [];
for (const t of tests) if (!suiteOrder.includes(t.suite)) suiteOrder.push(t.suite);

const suites = suiteOrder.map((name) => {
  const suiteTests = tests.filter((t) => t.suite === name);
  const roll = rollUp(suiteTests);
  roll.name = name;
  roll.passPct = pct(roll.passed, roll.total);
  roll.tests = suiteTests;
  return roll;
});

const timings = (raw.run && raw.run.timings) || {};
const execInfo = {
  collectionName: (raw.collection && raw.collection.info && raw.collection.info.name) || 'API Tests',
  environmentName: (raw.environment && raw.environment.name) || 'Unknown',
  baseUrl: getBaseUrl(raw.environment) || 'Not specified',
  executedAt: timings.started ? new Date(timings.started) : null,
  durationMs:
    typeof timings.completed === 'number' && typeof timings.started === 'number'
      ? timings.completed - timings.started
      : null,
  tool: detectTool(),
  suiteCount: suites.length,
};

const model = { execInfo, totals, suites, tests };

// ---------------------------------------------------------------------
// 5. Render
// ---------------------------------------------------------------------

fs.writeFileSync(outputPath, renderHtml(model), 'utf8');
fs.mkdirSync(REPORTS_DIR, { recursive: true });
fs.writeFileSync(path.join(REPORTS_DIR, 'latest.html'), renderHtml(model), 'utf8');

console.log(`HTML report written to: ${outputPath}`);
console.log(`Stable "latest" copy:   ${path.join(REPORTS_DIR, 'latest.html')}`);

// ---------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function fmtMs(ms) {
  if (ms == null) return '—';
  return `${ms.toLocaleString('en-US')} ms`;
}

function fmtDate(d) {
  if (!d) return 'Unknown';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Lightly formats common Chai/Postman assertion messages so the expected
 * vs. actual halves stand out, without assuming a fixed message shape --
 * anything that doesn't match a known pattern is shown as plain text. */
function formatAssertionMessage(message) {
  const m = esc(message);
  const expectedGotMatch = m.match(/^expected (.+?) to (.+?) but got (.+)$/i);
  if (expectedGotMatch) {
    return `expected <b>${expectedGotMatch[1]}</b> to ${expectedGotMatch[2]} but got <b>${expectedGotMatch[3]}</b>`;
  }
  const expectedToMatch = m.match(/^expected (.+?) to (.+)$/i);
  if (expectedToMatch) {
    return `expected <b>${expectedToMatch[1]}</b> to ${expectedToMatch[2]}`;
  }
  return m;
}

function statusChip(status) {
  const cls = status === 'PASSED' ? 'chip-pass' : status === 'FAILED' ? 'chip-fail' : 'chip-skip';
  return `<span class="chip ${cls}">${esc(status)}</span>`;
}

/** A dependency-free donut chart: three arcs (passed/failed/skipped) drawn
 * as stroked circle segments via stroke-dasharray, so it renders correctly
 * with nothing but inline SVG -- no chart library, no external script. */
function donutSvg(totals) {
  const size = 176;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const segments = [
    { value: totals.passed, color: '#2f9e56' },
    { value: totals.failed, color: '#d64545' },
    { value: totals.skipped, color: '#d99a2b' },
  ].filter((s) => s.value > 0);

  let offset = 0;
  const arcs = segments
    .map((s) => {
      const fraction = totals.total === 0 ? 0 : s.value / totals.total;
      const dash = fraction * circumference;
      const gap = circumference - dash;
      const circle = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${stroke}" stroke-dasharray="${dash.toFixed(
        2
      )} ${gap.toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})" />`;
      offset += dash;
      return circle;
    })
    .join('\n      ');

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${totals.passPct}% of tests passed">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border)" stroke-width="${stroke}" />
      ${arcs}
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" class="donut-pct">${totals.passPct}%</text>
      <text x="${cx}" y="${cy + 18}" text-anchor="middle" class="donut-label">pass rate</text>
    </svg>`;
}

function renderSuiteTableRow(s) {
  return `<tr>
    <td>${esc(s.name)}</td>
    <td class="num">${s.total}</td>
    <td class="num text-pass">${s.passed}</td>
    <td class="num ${s.failed > 0 ? 'text-fail' : ''}">${s.failed}</td>
    <td class="num ${s.skipped > 0 ? 'text-skip' : ''}">${s.skipped}</td>
    <td class="num">${statusChip(s.failed > 0 ? 'FAILED' : 'PASSED')} <span class="pct">${s.passPct}%</span></td>
  </tr>`;
}

function renderTestRow(t) {
  const errorCell =
    t.failures.length > 0
      ? t.failures.map((f) => `<div class="err-line">${formatAssertionMessage(f.message)}</div>`).join('')
      : '—';
  return `<tr class="${t.status === 'FAILED' ? 'row-fail' : ''}">
    <td>
      <div class="tc-name">${esc(t.name)}</div>
      ${t.description ? `<div class="tc-desc">${esc(t.description)}</div>` : ''}
    </td>
    <td class="mono">${esc(t.method)} ${esc(t.endpoint)}</td>
    <td>${statusChip(t.status)}</td>
    <td class="num mono">${fmtMs(t.durationMs)}</td>
    <td class="err-cell">${errorCell}</td>
  </tr>`;
}

function renderFailedTestCard(t) {
  return `<article class="fail-card">
    <header>
      <h3>${esc(t.name)}</h3>
      <span class="breadcrumb">${t.breadcrumb.map(esc).join(' &rsaquo; ')}</span>
    </header>
    ${t.description ? `<p class="fail-desc">${esc(t.description)}</p>` : ''}
    <dl class="fail-meta">
      <div><dt>Request</dt><dd class="mono">${esc(t.method)} ${esc(t.endpoint)}</dd></div>
      <div><dt>Response</dt><dd class="mono">${esc(t.statusCode)} ${esc(t.statusText)}</dd></div>
      <div><dt>Duration</dt><dd class="mono">${fmtMs(t.durationMs)}</dd></div>
      <div><dt>Assertions</dt><dd>${t.assertionsPassed} / ${t.assertionsTotal} passed</dd></div>
    </dl>
    <ul class="fail-list">
      ${t.failures
        .map(
          (f) =>
            `<li><span class="fail-assertion">${esc(f.assertion)}</span><span class="fail-message">${formatAssertionMessage(
              f.message
            )}</span></li>`
        )
        .join('\n      ')}
    </ul>
  </article>`;
}

function renderHtml(model) {
  const { execInfo, totals, suites, tests } = model;
  const failedTests = tests.filter((t) => t.status === 'FAILED');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(execInfo.collectionName)} &mdash; Automation Report</title>
<style>
  :root {
    --bg: #f2f5f6;
    --surface: #ffffff;
    --surface-2: #e9eef0;
    --border: #d7e0e3;
    --text: #10191c;
    --text-muted: #55676c;
    --text-faint: #8a999d;
    --accent: #2b6777;
    --accent-soft: #e2eef1;
    --pass: #1f8a4c;
    --pass-soft: #e5f5ea;
    --fail: #c23c3c;
    --fail-soft: #fbeaea;
    --skip: #b8791a;
    --skip-soft: #faf1de;
    --shadow: 0 1px 2px rgba(16,25,28,0.04), 0 10px 28px -18px rgba(16,25,28,0.28);
    --radius: 10px;
    --font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    --font-mono: ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0f1416;
      --surface: #171f22;
      --surface-2: #1d262a;
      --border: #2b363a;
      --text: #eaf0f1;
      --text-muted: #9db0b5;
      --text-faint: #66787d;
      --accent: #5fb4c4;
      --accent-soft: #17282c;
      --pass: #49b578;
      --pass-soft: #16281e;
      --fail: #e2726a;
      --fail-soft: #33201c;
      --skip: #dba54a;
      --skip-soft: #332813;
      --shadow: 0 1px 2px rgba(0,0,0,0.35), 0 10px 28px -18px rgba(0,0,0,0.6);
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-ui);
    font-size: 14px;
    line-height: 1.5;
    padding: 32px 20px 72px;
  }
  .page { max-width: 1080px; margin: 0 auto; }

  /* ---- header ---- */
  header.top {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-end;
    gap: 18px;
    padding-bottom: 20px;
    border-bottom: 2px solid var(--text);
    margin-bottom: 24px;
  }
  .eyebrow {
    font-family: var(--font-mono);
    font-size: 11.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--accent);
    margin: 0 0 6px;
  }
  h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.01em; margin: 0; text-wrap: balance; }
  .run-meta {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-muted);
    display: grid;
    gap: 3px;
    text-align: right;
  }
  .run-meta .k { color: var(--text-faint); }

  /* ---- overview: donut + stat tiles ---- */
  .overview {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 20px;
    margin-bottom: 28px;
  }
  .donut-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 18px 24px;
  }
  .donut-pct { font-family: var(--font-ui); font-weight: 800; font-size: 28px; fill: var(--text); }
  .donut-label { font-family: var(--font-mono); font-size: 11px; fill: var(--text-faint); text-transform: uppercase; letter-spacing: 0.05em; }
  .overall-status { display: flex; flex-direction: column; align-items: center; gap: 5px; }
  .overall-status-label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-faint); }

  .stat-tiles {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow);
  }
  .stat {
    background: var(--surface);
    padding: 16px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .stat .label { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-faint); }
  .stat .value { font-weight: 800; font-size: 24px; font-variant-numeric: tabular-nums; }
  .stat.pass .value { color: var(--pass); }
  .stat.fail .value { color: var(--fail); }
  .stat.skip .value { color: var(--skip); }

  /* ---- chips ---- */
  .chip {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.03em;
    padding: 3px 9px;
    border-radius: 999px;
  }
  .chip-pass { background: var(--pass-soft); color: var(--pass); }
  .chip-fail { background: var(--fail-soft); color: var(--fail); }
  .chip-skip { background: var(--skip-soft); color: var(--skip); }

  /* ---- section headings ---- */
  section { margin-bottom: 32px; }
  h2 {
    font-size: 15px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    margin: 0 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }

  /* ---- tables ---- */
  .table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); }
  table { width: 100%; border-collapse: collapse; background: var(--surface); }
  th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border); vertical-align: top; }
  thead th {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-faint);
    background: var(--surface-2);
  }
  tbody tr:last-child td { border-bottom: none; }
  .num { font-variant-numeric: tabular-nums; text-align: right; }
  .mono { font-family: var(--font-mono); font-size: 12.5px; color: var(--text-muted); }
  .text-pass { color: var(--pass); font-weight: 700; }
  .text-fail { color: var(--fail); font-weight: 700; }
  .text-skip { color: var(--skip); font-weight: 700; }
  .pct { font-family: var(--font-mono); font-size: 11.5px; color: var(--text-muted); margin-left: 4px; }
  .row-fail { background: var(--fail-soft); }
  .tc-name { font-weight: 600; }
  .tc-desc { color: var(--text-muted); font-size: 12.5px; margin-top: 2px; max-width: 34ch; }
  .err-cell { font-size: 12.5px; }
  .err-line { font-family: var(--font-mono); color: var(--fail); margin-bottom: 4px; }
  .err-line:last-child { margin-bottom: 0; }
  .err-line b { font-weight: 700; }

  /* ---- suite disclosure groups ---- */
  details.suite-group { margin-bottom: 14px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow); overflow: hidden; }
  details.suite-group[open] summary { border-bottom: 1px solid var(--border); }
  details.suite-group summary {
    list-style: none;
    cursor: pointer;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-weight: 700;
  }
  details.suite-group summary::-webkit-details-marker { display: none; }
  details.suite-group summary::before { content: "▸"; color: var(--text-faint); margin-right: 8px; font-size: 11px; }
  details.suite-group[open] summary::before { content: "▾"; }
  details.suite-group .table-wrap { border: none; border-radius: 0; box-shadow: none; }
  .summary-meta { font-family: var(--font-mono); font-size: 11.5px; color: var(--text-muted); font-weight: 500; }

  /* ---- failed test cards ---- */
  .fail-card {
    background: var(--surface);
    border: 1px solid var(--fail);
    border-left-width: 4px;
    border-radius: var(--radius);
    padding: 16px 18px;
    margin-bottom: 14px;
    box-shadow: var(--shadow);
  }
  .fail-card header { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .fail-card h3 { margin: 0; font-size: 15px; }
  .fail-card .breadcrumb { font-family: var(--font-mono); font-size: 11px; color: var(--text-faint); }
  .fail-desc { color: var(--text-muted); font-size: 12.5px; margin: 6px 0 12px; }
  .fail-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px 20px; margin: 0 0 12px; }
  .fail-meta div { display: flex; flex-direction: column; gap: 2px; }
  .fail-meta dt { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-faint); }
  .fail-meta dd { margin: 0; font-size: 13px; }
  .fail-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .fail-list li { background: var(--fail-soft); border-radius: 6px; padding: 8px 12px; display: grid; gap: 3px; }
  .fail-assertion { font-weight: 700; font-size: 12.5px; }
  .fail-message { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }
  .fail-message b { color: var(--fail); font-weight: 700; }
  .no-failures { color: var(--pass); font-weight: 600; padding: 14px 2px; }

  /* ---- execution info ---- */
  .exec-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px 24px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 18px 20px; }
  .exec-info div { display: flex; flex-direction: column; gap: 3px; }
  .exec-info dt { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-faint); }
  .exec-info dd { margin: 0; font-size: 13.5px; }

  footer.page-footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid var(--border); font-family: var(--font-mono); font-size: 11px; color: var(--text-faint); }

  @media (max-width: 720px) {
    .overview { grid-template-columns: 1fr; }
    .stat-tiles { grid-template-columns: repeat(2, 1fr); }
    header.top { flex-direction: column; align-items: flex-start; }
    .run-meta { text-align: left; }
  }
</style>
</head>
<body>
<div class="page">

  <header class="top">
    <div>
      <p class="eyebrow">API Automation &middot; ${esc(execInfo.tool)}</p>
      <h1>${esc(execInfo.collectionName)} &mdash; Test Report</h1>
    </div>
    <div class="run-meta">
      <div><span class="k">environment</span> ${esc(execInfo.environmentName)}</div>
      <div><span class="k">executed</span> ${esc(fmtDate(execInfo.executedAt))}</div>
      <div><span class="k">duration</span> ${fmtMs(execInfo.durationMs)}</div>
    </div>
  </header>

  <section class="overview">
    <div class="donut-card">
      ${donutSvg(totals)}
      <div class="overall-status">
        <span class="overall-status-label">Overall Status</span>
        ${statusChip(totals.overallStatus)}
      </div>
    </div>
    <div class="stat-tiles">
      <div class="stat"><span class="label">Total Tests</span><span class="value">${totals.total}</span></div>
      <div class="stat pass"><span class="label">Passed</span><span class="value">${totals.passed}</span></div>
      <div class="stat fail"><span class="label">Failed</span><span class="value">${totals.failed}</span></div>
      <div class="stat skip"><span class="label">Skipped</span><span class="value">${totals.skipped}</span></div>
    </div>
  </section>

  <section>
    <h2>Test Suite Summary</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Test Suite</th><th class="num">Total</th><th class="num">Passed</th><th class="num">Failed</th><th class="num">Skipped</th><th class="num">Pass %</th></tr>
        </thead>
        <tbody>
          ${suites.map(renderSuiteTableRow).join('\n          ')}
        </tbody>
      </table>
    </div>
  </section>

  <section>
    <h2>Failed Tests${failedTests.length ? ` (${failedTests.length})` : ''}</h2>
    ${
      failedTests.length === 0
        ? '<p class="no-failures">No failed tests in this run.</p>'
        : failedTests.map(renderFailedTestCard).join('\n    ')
    }
  </section>

  <section>
    <h2>Detailed Test Results</h2>
    ${suites
      .map(
        (s) => `<details class="suite-group" ${s.failed > 0 ? 'open' : ''}>
      <summary>
        <span>${esc(s.name)}</span>
        <span class="summary-meta">${s.passed}/${s.total} passed &middot; ${s.passPct}%</span>
      </summary>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Test Case</th><th>Request</th><th>Status</th><th class="num">Duration</th><th>Error</th></tr>
          </thead>
          <tbody>
            ${s.tests.map(renderTestRow).join('\n            ')}
          </tbody>
        </table>
      </div>
    </details>`
      )
      .join('\n    ')}
  </section>

  <section>
    <h2>Execution Information</h2>
    <dl class="exec-info">
      <div><dt>Collection</dt><dd>${esc(execInfo.collectionName)}</dd></div>
      <div><dt>Environment</dt><dd>${esc(execInfo.environmentName)}</dd></div>
      <div><dt>API base URL</dt><dd class="mono">${esc(execInfo.baseUrl)}</dd></div>
      <div><dt>Executed at</dt><dd>${esc(fmtDate(execInfo.executedAt))}</dd></div>
      <div><dt>Total duration</dt><dd>${fmtMs(execInfo.durationMs)}</dd></div>
      <div><dt>Test framework</dt><dd>${esc(execInfo.tool)}</dd></div>
      <div><dt>Test suites executed</dt><dd>${execInfo.suiteCount}</dd></div>
    </dl>
  </section>

  <footer class="page-footer">
    Generated by newman/generate-report.js from a Newman JSON export. Source JSON is used as input data only and is not reproduced above.
  </footer>

</div>
</body>
</html>
`;
}
