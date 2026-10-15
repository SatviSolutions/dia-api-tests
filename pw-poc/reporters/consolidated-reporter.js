// Playwright reporter: one consolidated DIA API report (test results + per-endpoint status), enabled with DIA_CONSOLIDATED_REPORT=1.
//
// Publishing rules (the last valid full-suite report is never lost):
//   * Only a demonstrably COMPLETE, SUCCESSFUL full-suite run (finished normally, no environment/login failure, no unexpected
//     test failure) is published as report/current.
//   * A complete full run WITH unexpected failures is published separately as report/failed-full; report/current is untouched.
//   * Partial runs (file/grep/shard filters, .only, missing spec files, tests that did not run, fewer tests than the last full
//     run) go to report/partial and never touch report/current. If completeness cannot be established, the run is partial.
//   * Interrupted runs, global errors, environment/login failures, runs that executed no test (for example --list) and any
//     report-generation error publish nothing.
//   * Reports are built in report/runs/.staging-<id>, validated, moved to report/runs/<slot>-<id> and published by atomically
//     replacing the report/<slot> symlink; the previous run directory of that slot is then removed.
// The inventory (pw-poc/endpoint-inventory.json) is only read, never changed. Only test-body requests are endpoint evidence.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { buildMatcher } = require('./endpoint-matcher');
const { renderHtml, renderJunit, MARKER } = require('./render');

const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;
const ENVIRONMENT_FAILURE = /Set DIA_USERNAME and DIA_PASSWORD|Login failed: HTTP|Non-admin login failed|ECONNREFUSED|ENOTFOUND|EHOSTUNREACH|ENETUNREACH|ETIMEDOUT|socket hang up/i;
const FLAGS_WITH_VALUE = new Set(['-c', '--config', '-g', '--grep', '--grep-invert', '-j', '--workers', '--project', '--shard', '--reporter', '--retries',
  '--timeout', '--repeat-each', '--max-failures', '--output', '--trace', '--global-timeout', '--tsconfig', '--ui-host', '--ui-port', '--browser']);
const FILTER_FLAGS = new Set(['-g', '--grep', '--grep-invert', '--shard', '--last-failed', '--only-changed', '--project', '--max-failures', '-x', '--list', '--repeat-each']);
const STATUSES = ['PASSED', 'FAILED', 'BLOCKED', 'MISSING', 'SKIPPED', 'DEFECT-ONLY', 'NOT REQUIRED', 'NOT RUN'];
const MAX_TESTS_PER_ENDPOINT = 30;

// ---- redaction: nothing secret may reach the report ----
// A "strong" secret (8+ characters or containing a non-letter) can be searched for literally anywhere. A "weak" one (a short,
// letters-only word) also occurs in ordinary text such as route names, so it is only treated as a leak when it appears quoted
// exactly or as the value of a password-like key (the generic patterns in redact() cover the key case).
function secretValues() {
  return [process.env.DIA_PASSWORD, process.env.DIA_VIEWER_PASSWORD]
    .filter((value) => value && value.length >= 4)
    .map((value) => ({ value, strong: value.length >= 8 || /[^A-Za-z]/.test(value) }));
}
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function redact(text, limit = 4000) {
  let out = String(text ?? '').replace(ANSI, '');
  for (const { value, strong } of secretValues()) {
    if (strong) out = out.split(value).join('[redacted]');
    else out = out.replace(new RegExp(`(["'\`])${escapeRegex(value)}\\1`, 'g'), '$1[redacted]$1');
  }
  out = out
    .replace(/eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]*/g, '[redacted-jwt]')
    .replace(/(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi, '$1 [redacted]')
    .replace(/(authorization|cookie|set-cookie|x-api-key)(["']?\s*[:=]\s*["']?)[^\s"',}]+/gi, '$1$2[redacted]')
    .replace(/("?(?:password|passwd|secret|token|access_token|refresh_token|api_key|apikey|private_key|connection_string|key_value)"?\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,}]+)/gi, '$1"[redacted]"');
  return out.length > limit ? `${out.slice(0, limit)}\n... [truncated]` : out;
}

const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');
const say = (text) => process.stderr.write(`[consolidated-report] ${text}\n`);

function walk(dir, predicate, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, predicate, found);
    else if (predicate(entry.name)) found.push(full);
  }
  return found;
}

function cliProblems(argv) {
  // The reporter runs in the Playwright runner process, so the command line is available.
  const args = argv.slice(2);
  const at = args.indexOf('test');
  const rest = at >= 0 ? args.slice(at + 1) : args;
  const reasons = [];
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    const name = arg.split('=')[0];
    if (arg.startsWith('-')) {
      if (FILTER_FLAGS.has(name)) reasons.push(`command-line option ${name}`);
      if (FLAGS_WITH_VALUE.has(name) && !arg.includes('=')) i += 1;
    } else {
      reasons.push(`command-line test filter "${arg}"`);
    }
  }
  return reasons;
}

class ConsolidatedReporter {
  constructor(options = {}) {
    this.pwDir = path.resolve(__dirname, '..');
    this.reportDir = options.reportDir || path.join(this.pwDir, 'report');
    this.inventoryPath = options.inventoryPath || path.join(this.pwDir, 'endpoint-inventory.json');
    this.globalErrors = [];
  }

  printsToStdio() {
    return false;
  }

  onBegin(config, suite) {
    this.config = config;
    this.suite = suite;
    this.startedAt = new Date();
    this.tests = suite.allTests();
  }

  onError(error) {
    this.globalErrors.push(redact(error && (error.message || error.value) ? error.message || error.value : String(error), 500));
  }

  async onEnd(result) {
    try {
      this.finish(result);
    } catch (error) {
      say(`NOT published: ${redact(error && error.stack ? error.stack.split('\n')[0] : error, 300)}. The previous reports are unchanged.`);
    }
  }

  // ---- per-test record ----
  testRecord(test) {
    const last = test.results[test.results.length - 1];
    const titles = test.titlePath().slice(2); // [file, ...describes, title]
    const file = titles[0] || path.basename(test.location.file);
    const title = titles.slice(1).join(' › ') || test.title;
    const key = `${file}::${title}`;
    let verdict;
    if (!last) verdict = 'did-not-run';
    else if (last.status === 'skipped' || test.outcome() === 'skipped') verdict = 'skipped';
    else if (test.expectedStatus === 'failed') verdict = test.outcome() === 'expected' ? 'known-defect' : last.status === 'passed' ? 'unexpected-pass' : 'failed';
    else if (test.outcome() === 'flaky') verdict = 'flaky';
    else if (last.status === 'passed') verdict = 'passed';
    else verdict = 'failed';
    let requests = [];
    let nonTest = [];
    if (last) {
      const attachment = last.attachments.find((a) => a.name === 'api-requests.json' && a.body);
      if (attachment) {
        try {
          const parsed = JSON.parse(attachment.body.toString('utf8'));
          requests = (parsed.requests || []).filter((r) => r.phase === 'test');
          nonTest = parsed.nonTestRequests || [];
        } catch { /* unreadable log: no evidence from this test */ }
      }
    }
    const skipAnnotation = test.annotations.find((a) => a.type === 'skip' && a.description);
    const errors = last ? last.errors || (last.error ? [last.error] : []) : [];
    const error = errors.length ? redact(errors.map((e) => e.message || e.value || String(e)).join('\n\n'), 4000) : '';
    return {
      key,
      id: test.id,
      file,
      line: test.location.line,
      title,
      verdict,
      durationMs: last ? last.duration : 0,
      startedAt: last ? last.startTime.toISOString() : null,
      error,
      rawError: errors.length ? errors.map((e) => e.message || e.value || String(e)).join('\n') : '',
      skipReason: skipAnnotation ? redact(skipAnnotation.description, 300) : verdict === 'skipped' ? 'skipped' : '',
      annotations: test.annotations.filter((a) => a.type !== 'skip').map((a) => redact(`${a.type}${a.description ? `: ${a.description}` : ''}`, 300)),
      requests,
      nonTest,
    };
  }

  // ---- endpoint status from evidence ----
  buildEndpoints(inventory, records, mode, previousAssociations) {
    const matcher = buildMatcher(inventory.endpoints);
    const keyOf = (e) => `${e.method} ${e.route}`;
    const evidence = new Map(); // endpoint key -> { tests: Map(testKey -> { rec, statuses:[], last }), other: {count, statuses} }
    const diagnostics = { unmatched: new Map(), ambiguous: new Map(), externalRequests: 0, nonTestRequests: 0 };
    const ensure = (entry) => {
      const key = keyOf(entry);
      if (!evidence.has(key)) evidence.set(key, { tests: new Map(), other: { count: 0, statuses: {} } });
      return evidence.get(key);
    };
    const testEndpoints = new Map(); // testKey -> Set(endpoint key), for the association file

    for (const rec of records) {
      rec.matchedRequests = [];
      for (const r of rec.requests) {
        if (r.external) { diagnostics.externalRequests += 1; continue; }
        const pathUsed = r.requestedPath || r.finalPath;
        const found = matcher.match(r.method, pathUsed);
        const shown = { method: r.method, path: pathUsed, status: r.status, matched: Boolean(found.entry) };
        rec.matchedRequests.push(shown);
        if (found.entry) {
          const ev = ensure(found.entry);
          if (!ev.tests.has(rec.key)) ev.tests.set(rec.key, { rec, statuses: [], last: null });
          const slot = ev.tests.get(rec.key);
          slot.statuses.push(r.status);
          if (!slot.last || r.startedAt > slot.last) slot.last = r.startedAt;
          if (!testEndpoints.has(rec.key)) testEndpoints.set(rec.key, new Set());
          testEndpoints.get(rec.key).add(keyOf(found.entry));
        } else if (found.ambiguous) {
          const k = `${r.method} ${pathUsed}`;
          diagnostics.ambiguous.set(k, { method: r.method, path: pathUsed, candidates: found.ambiguous.map(keyOf) });
        } else {
          const k = `${r.method} ${pathUsed} ${r.status}`;
          const cur = diagnostics.unmatched.get(k) || { method: r.method, path: pathUsed, status: r.status, count: 0 };
          cur.count += 1;
          diagnostics.unmatched.set(k, cur);
        }
      }
      for (const r of rec.nonTest) {
        diagnostics.nonTestRequests += 1;
        if (r.external) continue;
        const found = matcher.match(r.method, r.requestedPath || r.finalPath);
        if (found.entry) {
          const ev = ensure(found.entry);
          ev.other.count += 1;
          ev.other.statuses[r.status] = (ev.other.statuses[r.status] || 0) + 1;
        }
      }
    }

    // endpoints associated with tests that were skipped in this run, from the last valid full run (if known)
    const skippedAssociation = new Map(); // endpoint key -> [test titles]
    for (const rec of records) {
      if (rec.verdict !== 'skipped') continue;
      for (const endpointKey of (previousAssociations && previousAssociations[rec.key]) || []) {
        if (!skippedAssociation.has(endpointKey)) skippedAssociation.set(endpointKey, []);
        skippedAssociation.get(endpointKey).push(rec);
      }
    }

    const label = { 'has-tests': 'Covered', 'defect-only-tests': 'Defect-only', missing: 'Missing', blocked: 'Blocked', 'not-required': 'Not Required' };
    const endpoints = inventory.endpoints.map((entry) => {
      const key = keyOf(entry);
      const ev = evidence.get(key) || { tests: new Map(), other: { count: 0, statuses: {} } };
      const tests = [...ev.tests.values()];
      const by = (verdicts) => tests.filter((t) => verdicts.includes(t.rec.verdict));
      const failing = by(['failed', 'unexpected-pass']);
      const passing = by(['passed', 'flaky']);
      const defects = by(['known-defect']);
      const skippedTests = skippedAssociation.get(key) || [];
      const documented = label[entry.classification];
      const drift = [];
      let status;
      if (failing.length) status = 'FAILED';
      else if (passing.length) status = 'PASSED';
      else if (skippedTests.length && !defects.length) status = 'SKIPPED';
      else if (defects.length) status = 'DEFECT-ONLY';
      else if (entry.classification === 'blocked') status = 'BLOCKED';
      else if (entry.classification === 'missing') status = 'MISSING';
      else if (entry.classification === 'not-required') status = 'NOT REQUIRED';
      else status = 'NOT RUN'; // documented as covered (or defect-only) but no qualifying request reached it in this run

      const reached = tests.length > 0;
      if (reached && ['missing', 'blocked', 'not-required'].includes(entry.classification)) drift.push(`Documented as ${documented}, but a test-body request reached it in this run.`);
      if (entry.classification === 'has-tests' && status === 'NOT RUN' && mode === 'full') drift.push('Documented as Covered, but no qualifying test-body request reached it in this run.');
      if (entry.classification === 'has-tests' && status === 'DEFECT-ONLY') drift.push('Documented as Covered, but only expected-failure (known-defect) tests reached it.');
      if (entry.classification === 'defect-only-tests' && status === 'PASSED') drift.push('Documented as Defect-only, but a regular passing test reached it.');
      if (entry.classification === 'defect-only-tests' && status === 'NOT RUN' && mode === 'full') drift.push('Documented as Defect-only, but no qualifying request reached it in this run.');
      if (failing.some((t) => t.rec.verdict === 'unexpected-pass')) drift.push('A known-defect test unexpectedly passed: the defect may be fixed (remove test.fail after verifying).');

      const httpStatuses = {};
      let lastRequestAt = null;
      for (const t of tests) {
        for (const code of t.statuses) httpStatuses[code] = (httpStatuses[code] || 0) + 1;
        if (t.last && (!lastRequestAt || t.last > lastRequestAt)) lastRequestAt = t.last;
      }
      const failures = failing.slice(0, 5).map((t) => {
        const matched = t.rec.matchedRequests || [];
        const lastRequest = matched.length ? matched[matched.length - 1] : null;
        return {
          test: `${t.rec.file} › ${t.rec.title}`,
          verdict: t.rec.verdict,
          lastRequest: lastRequest ? `${lastRequest.method} ${lastRequest.path} -> HTTP ${lastRequest.status}` : '',
          message: t.rec.verdict === 'unexpected-pass' ? 'Known-defect test (test.fail) passed unexpectedly.' : t.rec.error.slice(0, 1500),
        };
      });
      const ordered = tests.sort((a, b) => a.rec.file.localeCompare(b.rec.file) || a.rec.title.localeCompare(b.rec.title));
      return {
        key,
        method: entry.method,
        route: entry.route,
        area: entry.area,
        documented,
        priority: entry.priority,
        negativeOnly: Boolean(entry.negativeOnly),
        sourceFile: entry.sourceFile || null,
        note: entry.note || null,
        blocked: entry.classification === 'blocked' ? { reason: entry.reason, unblock: entry.unblock } : null,
        status,
        httpStatuses,
        lastRequestAt,
        tests: ordered.slice(0, MAX_TESTS_PER_ENDPOINT).map((t) => ({ title: t.rec.title, file: t.rec.file, verdict: t.rec.verdict, statuses: [...new Set(t.statuses)] })),
        moreTests: Math.max(0, ordered.length - MAX_TESTS_PER_ENDPOINT),
        failures,
        drift,
        nonQualifying: ev.other,
      };
    });
    const associations = {};
    for (const [testKey, set] of testEndpoints) associations[testKey] = [...set];
    return { endpoints, diagnostics, associations };
  }

  readPrevious() {
    try {
      const file = path.join(this.reportDir, 'current', 'data.json');
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return null;
    }
  }

  finish(result) {
    if (!fs.existsSync(this.inventoryPath)) throw new Error(`inventory not found: ${this.inventoryPath}`);
    const inventory = JSON.parse(fs.readFileSync(this.inventoryPath, 'utf8'));
    const records = this.tests.map((test) => this.testRecord(test));
    const executed = records.filter((r) => r.verdict !== 'did-not-run' && r.verdict !== 'skipped');
    if (executed.length === 0) {
      say('no test was executed (for example --list or everything skipped): nothing published, existing reports unchanged.');
      return;
    }

    // ---- is this run valid at all? ----
    const invalid = [];
    if (result.status === 'interrupted' || result.status === 'timedout') invalid.push(`the run ended as "${result.status}"`);
    if (this.globalErrors.length) invalid.push(`${this.globalErrors.length} global error(s): ${this.globalErrors[0]}`);
    const envFailures = records.filter((r) => r.verdict === 'failed' && ENVIRONMENT_FAILURE.test(r.rawError));
    if (envFailures.length) invalid.push(`environment/login failure in ${envFailures.length} test(s), for example "${envFailures[0].error.split('\n')[0].slice(0, 120)}"`);
    if (invalid.length) {
      say(`NOT published (invalid run): ${invalid.join('; ')}. Existing reports unchanged.`);
      return;
    }

    // ---- is it demonstrably complete? otherwise it is partial ----
    const partialReasons = cliProblems(process.argv);
    const project = this.config.projects[0];
    const testDir = project ? project.testDir : path.join(this.pwDir, 'tests');
    const specFiles = walk(testDir, (name) => name.endsWith('.spec.js'));
    const seen = new Set(this.tests.map((t) => path.resolve(t.location.file)));
    const missingSpecs = specFiles.filter((file) => !seen.has(path.resolve(file)));
    if (missingSpecs.length) partialReasons.push(`${missingSpecs.length} spec file(s) contributed no test (${missingSpecs.slice(0, 3).map((f) => path.basename(f)).join(', ')}${missingSpecs.length > 3 ? ', ...' : ''})`);
    if (specFiles.some((file) => /\.only\s*\(/.test(fs.readFileSync(file, 'utf8')))) partialReasons.push('a spec contains .only');
    const grep = this.config.grep;
    const defaultGrep = (re) => re && re.source === '.*';
    if (Array.isArray(grep) ? !grep.every(defaultGrep) : !defaultGrep(grep)) partialReasons.push('a grep filter is active');
    if (this.config.grepInvert) partialReasons.push('a grep-invert filter is active');
    if (this.config.shard) partialReasons.push('sharded run');
    const notRun = records.filter((r) => r.verdict === 'did-not-run').length;
    if (notRun) partialReasons.push(`${notRun} test(s) did not run`);
    const previous = this.readPrevious();
    if (previous && previous.meta && previous.meta.mode === 'full' && records.length < (previous.testCounts.total || 0)) partialReasons.push(`fewer tests (${records.length}) than the last full run (${previous.testCounts.total})`);
    const mode = partialReasons.length ? 'partial' : 'full';

    const counts = {
      total: records.length,
      passed: records.filter((r) => r.verdict === 'passed').length,
      failed: records.filter((r) => r.verdict === 'failed').length,
      skipped: records.filter((r) => r.verdict === 'skipped').length,
      flaky: records.filter((r) => r.verdict === 'flaky').length,
      knownDefect: records.filter((r) => r.verdict === 'known-defect').length,
      unexpectedPass: records.filter((r) => r.verdict === 'unexpected-pass').length,
      didNotRun: notRun,
    };
    const hasFailures = counts.failed > 0 || counts.unexpectedPass > 0;
    let slot;
    if (mode === 'partial') slot = 'partial';
    else if (hasFailures) slot = 'failed-full';
    else slot = 'current';

    const built = this.buildEndpoints(inventory, records, mode, previous && previous.associations);
    const endpointCounts = Object.fromEntries(STATUSES.map((s) => [s, built.endpoints.filter((e) => e.status === s).length]));
    const notRequired = endpointCounts['NOT REQUIRED'];
    const denominator = built.endpoints.length - notRequired;
    const endedAt = new Date();
    const runId = `${stamp()}-${crypto.randomBytes(3).toString('hex')}`;
    let targetHost = '';
    let baseUrl = '';
    try { const u = new URL(this.config.projects[0].use.baseURL); targetHost = u.host; baseUrl = u.origin; } catch { /* no base URL */ }
    const data = {
      schema: 1,
      meta: {
        runId,
        slot,
        mode,
        complete: mode === 'full',
        partialReasons,
        generatedAt: endedAt.toISOString(),
        startedAt: this.startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationMs: endedAt - this.startedAt,
        playwright: require('@playwright/test/package.json').version,
        targetHost,
        baseUrl,
        runtimeNote: 'Inventory read statically from the QA source tree; that the gateway serves this tree is not verified at runtime.',
      },
      inventory: {
        generated: inventory.generated,
        source: inventory.source,
        counts: inventory.counts,
        unverifiedDevOnly: inventory.unverifiedDevOnly || [],
      },
      testCounts: counts,
      endpointCounts,
      coverage: {
        passed: endpointCounts.PASSED,
        total: built.endpoints.length,
        notRequired,
        percent: denominator ? (100 * endpointCounts.PASSED) / denominator : 0,
        note: 'PASSED means a test-body request reached the endpoint and every test that reached it passed its assertions; defect-only, failed, skipped, blocked, missing and not-run endpoints are not counted.',
      },
      tests: records.map((r) => ({
        key: r.key,
        file: r.file,
        line: r.line,
        title: r.title,
        verdict: r.verdict,
        durationMs: r.durationMs,
        startedAt: r.startedAt,
        error: r.error,
        skipReason: r.skipReason,
        annotations: r.annotations,
        requests: (r.matchedRequests || []).slice(0, 60),
        endpoints: [...new Set((r.matchedRequests || []).filter((x) => x.matched).map((x) => `${x.method} ${x.path}`))].slice(0, 12),
      })),
      endpoints: built.endpoints,
      diagnostics: {
        unmatched: [...built.diagnostics.unmatched.values()].sort((a, b) => b.count - a.count).slice(0, 200),
        ambiguous: [...built.diagnostics.ambiguous.values()].slice(0, 100),
        externalRequests: built.diagnostics.externalRequests,
        nonTestRequests: built.diagnostics.nonTestRequests,
      },
      associations: built.associations,
    };

    this.publish(slot, runId, data);
    const url = slot === 'current' ? 'http://localhost:9400/' : `http://localhost:9400/${slot}`;
    say(`${mode} run published to report/${slot} (${endpointCounts.PASSED}/${denominator} endpoints PASSED, ${counts.passed + counts.knownDefect + counts.flaky}/${counts.total} tests as expected). View: ${url} (npm run report:start)`);
    if (mode === 'partial') say(`partial run (${partialReasons.join('; ')}): the full-suite report was NOT changed.`);
    if (slot === 'failed-full') say('complete full run with unexpected failures: published at /failed-full; the main report (report/current, last fully successful run) was NOT replaced.');
  }

  // ---- staging, validation, atomic publish ----
  publish(slot, runId, data) {
    const runsDir = path.join(this.reportDir, 'runs');
    fs.mkdirSync(runsDir, { recursive: true });
    this.cleanStaging(runsDir);
    const staging = path.join(runsDir, `.staging-${runId}`);
    const finalDir = path.join(runsDir, `${slot}-${runId}`);
    let moved = false;
    try {
      fs.mkdirSync(staging);
      fs.writeFileSync(path.join(staging, 'data.json'), `${JSON.stringify(data)}\n`);
      fs.writeFileSync(path.join(staging, 'index.html'), renderHtml(data));
      fs.writeFileSync(path.join(staging, 'junit.xml'), renderJunit(data));
      fs.writeFileSync(path.join(staging, 'meta.json'), `${JSON.stringify({ runId, slot, mode: data.meta.mode, generatedAt: data.meta.generatedAt, totals: data.testCounts })}\n`);
      this.validate(staging, data);
      fs.renameSync(staging, finalDir);
      moved = true;
      const link = path.join(this.reportDir, slot);
      let previousTarget = null;
      try { previousTarget = fs.realpathSync(link); } catch { /* first publication of this slot */ }
      const tmp = path.join(this.reportDir, `.${slot}-${runId}.tmp`);
      fs.symlinkSync(path.relative(this.reportDir, finalDir), tmp);
      try {
        fs.renameSync(tmp, link); // atomic replacement of the symlink: readers see the old or the new report, never a mix
      } catch (error) {
        fs.rmSync(tmp, { force: true });
        throw error;
      }
      if (previousTarget && previousTarget !== finalDir && previousTarget.startsWith(runsDir + path.sep)) fs.rmSync(previousTarget, { recursive: true, force: true });
    } catch (error) {
      fs.rmSync(staging, { recursive: true, force: true });
      if (moved) fs.rmSync(finalDir, { recursive: true, force: true });
      throw error;
    }
  }

  validate(dir, data) {
    const read = JSON.parse(fs.readFileSync(path.join(dir, 'data.json'), 'utf8'));
    const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    const xml = fs.readFileSync(path.join(dir, 'junit.xml'), 'utf8');
    const inventory = JSON.parse(fs.readFileSync(this.inventoryPath, 'utf8'));
    const statusTotal = Object.values(read.endpointCounts).reduce((a, b) => a + b, 0);
    const problems = [];
    if (read.endpoints.length !== inventory.endpoints.length) problems.push('endpoint count differs from the inventory');
    if (statusTotal !== read.endpoints.length) problems.push('endpoint status counts do not add up');
    if (read.tests.length !== data.testCounts.total) problems.push('test count mismatch');
    const verdictTotal = ['passed', 'failed', 'skipped', 'flaky', 'knownDefect', 'unexpectedPass', 'didNotRun'].reduce((sum, k) => sum + read.testCounts[k], 0);
    if (verdictTotal !== read.testCounts.total) problems.push('test result counts do not add up');
    if (!html.includes(MARKER) || html.length < 5000) problems.push('index.html is incomplete');
    if (!xml.startsWith('<?xml')) problems.push('junit.xml is incomplete');
    const text = JSON.stringify(read);
    const runtime = [
      ...read.tests.flatMap((t) => [t.error, t.skipReason, ...t.annotations]),
      ...read.endpoints.flatMap((e) => e.failures.map((f) => f.message)),
    ].join('\n');
    for (const { value, strong } of secretValues()) {
      const leaked = strong
        ? text.includes(value) || html.includes(value)
        : new RegExp(`(["'\`])${escapeRegex(value)}\\1`).test(runtime);
      if (leaked) problems.push('a secret value was found in the report');
    }
    if (/eyJ[\w-]{10,}\.[\w-]{10,}\./.test(text)) problems.push('a JWT-shaped value was found in the report');
    if (problems.length) throw new Error(`report validation failed: ${problems.join('; ')}`);
  }

  cleanStaging(runsDir) {
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const entry of fs.readdirSync(runsDir)) {
      if (!entry.startsWith('.staging-')) continue; // only leftovers of this workflow
      const full = path.join(runsDir, entry);
      try { if (fs.statSync(full).mtimeMs < cutoff) fs.rmSync(full, { recursive: true, force: true }); } catch { /* already gone */ }
    }
  }
}

module.exports = ConsolidatedReporter;
module.exports.redact = redact;
