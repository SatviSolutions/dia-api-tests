#!/usr/bin/env node
// Local server for the consolidated DIA API report. Bound to 127.0.0.1 only. It serves whatever the reporter last published, reading
// the files on every request (Cache-Control: no-store), so a new report appears without restarting or reconfiguring anything.
//
//   node pw-poc/report/serve.js serve    run in the foreground (Ctrl+C to stop)
//   node pw-poc/report/serve.js start    run in the background (PID in pw-poc/report/.server.pid, log in .server.log)
//   node pw-poc/report/serve.js stop     stop the background server started by "start"
//   node pw-poc/report/serve.js status   show whether it is running
//
// URLs: /  latest valid full-suite report | /partial  latest partial run | /failed-full  latest complete run with failures.
// The port is 9400 (override only explicitly with DIA_REPORT_PORT). If it is taken the server stops with a message; it never
// silently picks another port.

const http = require('http');
const fs = require('fs');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const HOST = '127.0.0.1';
const PORT = Number(process.env.DIA_REPORT_PORT || 9400);
const REPORT_DIR = __dirname;
const RUNS_DIR = path.join(REPORT_DIR, 'runs');
const PID_FILE = path.join(REPORT_DIR, '.server.pid');
const LOG_FILE = path.join(REPORT_DIR, '.server.log');
const SLOTS = ['current', 'partial', 'failed-full'];
const FILES = { 'index.html': 'text/html; charset=utf-8', 'data.json': 'application/json; charset=utf-8', 'junit.xml': 'application/xml; charset=utf-8' };
const ALLOWED_HOSTS = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`, `[::1]:${PORT}`]);
const CSP = "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'";

function send(res, status, type, body) {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': CSP,
  });
  res.end(body);
}

// The directory a slot currently points to, or null. Only directories inside report/runs are ever served.
function slotDir(slot) {
  try {
    const real = fs.realpathSync(path.join(REPORT_DIR, slot));
    return real.startsWith(RUNS_DIR + path.sep) ? real : null;
  } catch {
    return null;
  }
}

function status() {
  const out = {};
  for (const slot of SLOTS) {
    const dir = slotDir(slot);
    if (!dir) continue;
    try { out[slot] = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')); } catch { /* being replaced */ }
  }
  return out;
}

const WAITING = `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="5"><title>DIA API report</title>
<body style="font:16px system-ui;margin:2rem;max-width:42rem"><h1>No full-suite report yet</h1>
<p>Run <code>npm run test:report</code> (full suite). This page refreshes by itself and shows the report as soon as one is published.</p>
<p>Partial runs, if any, are at <a href="/partial">/partial</a>; a complete run with unexpected failures at <a href="/failed-full">/failed-full</a>.</p></body>`;

function handle(req, res) {
  if (!ALLOWED_HOSTS.has(String(req.headers.host || '').toLowerCase())) return send(res, 403, 'text/plain; charset=utf-8', 'Forbidden host\n');
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'text/plain; charset=utf-8', 'Method not allowed\n');
  const pathname = decodeURIComponent(new URL(req.url, `http://${HOST}`).pathname);
  if (pathname === '/_status') return send(res, 200, 'application/json; charset=utf-8', JSON.stringify(status()));

  let slot = 'current';
  let file = 'index.html';
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length && SLOTS.includes(parts[0]) && parts[0] !== 'current') slot = parts.shift();
  else if (parts.length && parts[0] === 'current') parts.shift();
  if (parts.length > 1) return send(res, 404, 'text/plain; charset=utf-8', 'Not found\n');
  if (parts.length === 1) file = parts[0];
  if (!Object.prototype.hasOwnProperty.call(FILES, file)) return send(res, 404, 'text/plain; charset=utf-8', 'Not found\n');

  const dir = slotDir(slot);
  if (!dir) {
    if (slot === 'current' && file === 'index.html') return send(res, 200, 'text/html; charset=utf-8', WAITING);
    return send(res, 404, 'text/plain; charset=utf-8', `No ${slot} report has been published yet\n`);
  }
  try {
    return send(res, 200, FILES[file], fs.readFileSync(path.join(dir, file)));
  } catch {
    return send(res, 503, 'text/plain; charset=utf-8', 'The report is being replaced; retry in a moment\n');
  }
}

function serve() {
  const server = http.createServer((req, res) => {
    try { handle(req, res); } catch { send(res, 400, 'text/plain; charset=utf-8', 'Bad request\n'); }
  });
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') process.stderr.write(`Port ${PORT} on ${HOST} is already in use. Not selecting another port: stop the other process or set DIA_REPORT_PORT explicitly.\n`);
    else process.stderr.write(`Server error: ${error.message}\n`);
    process.exit(1);
  });
  server.listen(PORT, HOST, () => process.stdout.write(`DIA API report: http://localhost:${PORT}/ (127.0.0.1 only). Ctrl+C to stop.\n`));
  const shutdown = () => {
    try { if (fs.readFileSync(PID_FILE, 'utf8').trim() === String(process.pid)) fs.rmSync(PID_FILE, { force: true }); } catch { /* none */ }
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

const readPid = () => {
  try { return Number(fs.readFileSync(PID_FILE, 'utf8').trim()) || null; } catch { return null; }
};
// True only for a live process that really is this server (guards against a recycled PID).
function isOurServer(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0').some((part) => part.endsWith(`report${path.sep}serve.js`) || part.endsWith('serve.js'));
  } catch {
    return false;
  }
}
const portFree = () => new Promise((resolve) => {
  const probe = net.createServer();
  probe.once('error', () => resolve(false));
  probe.listen(PORT, HOST, () => probe.close(() => resolve(true)));
});
const isListening = () => new Promise((resolve) => {
  const socket = net.connect({ host: HOST, port: PORT });
  socket.once('connect', () => { socket.destroy(); resolve(true); });
  socket.once('error', () => resolve(false));
});
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function start() {
  const existing = readPid();
  if (isOurServer(existing)) {
    process.stdout.write(`Already running (PID ${existing}): http://localhost:${PORT}/\n`);
    return;
  }
  if (existing) fs.rmSync(PID_FILE, { force: true }); // stale PID file
  if (!(await portFree())) {
    process.stderr.write(`Port ${PORT} on ${HOST} is already in use by another process. Not selecting another port: free it or set DIA_REPORT_PORT explicitly.\n`);
    process.exit(1);
  }
  const log = fs.openSync(LOG_FILE, 'a');
  const child = spawn(process.execPath, [__filename, 'serve'], { detached: true, stdio: ['ignore', log, log], env: process.env });
  child.unref();
  fs.writeFileSync(PID_FILE, `${child.pid}\n`);
  for (let i = 0; i < 25; i += 1) {
    await sleep(200);
    if (!isOurServer(child.pid)) break;
    if (await isListening()) {
      process.stdout.write(`Report server started (PID ${child.pid}): http://localhost:${PORT}/\n`);
      return;
    }
  }
  fs.rmSync(PID_FILE, { force: true });
  process.stderr.write(`The server did not start. See ${LOG_FILE}\n`);
  process.exit(1);
}

async function stop() {
  const pid = readPid();
  if (!pid) {
    process.stdout.write('Not running (no PID file).\n');
    return;
  }
  if (!isOurServer(pid)) {
    fs.rmSync(PID_FILE, { force: true });
    process.stdout.write('Not running (stale PID file removed).\n');
    return;
  }
  process.kill(pid, 'SIGTERM');
  for (let i = 0; i < 25 && isOurServer(pid); i += 1) await sleep(200);
  fs.rmSync(PID_FILE, { force: true });
  process.stdout.write(isOurServer(pid) ? `PID ${pid} did not exit; stop it manually.\n` : 'Stopped.\n');
}

function showStatus() {
  const pid = readPid();
  process.stdout.write(isOurServer(pid) ? `Running (PID ${pid}): http://localhost:${PORT}/\n` : 'Not running.\n');
}

const command = process.argv[2] || 'serve';
const commands = { serve, start, stop, status: showStatus };
if (!commands[command]) {
  process.stderr.write(`Unknown command "${command}". Use: serve | start | stop | status\n`);
  process.exit(2);
}
Promise.resolve(commands[command]()).catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
