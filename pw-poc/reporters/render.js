// Renders the consolidated report: one self-contained HTML page (no external requests), plus a JUnit XML summary.
// All text coming from the data is inserted with textContent in the browser and escaped for XML here, never as markup.

const MARKER = '<!--DIA-CONSOLIDATED-REPORT-->';

const escapeXml = (value) => String(value ?? '').replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

// ---- JUnit: test results per spec file, plus one property-only suite that lists the BLOCKED endpoints (no extra test cases) ----
function renderJunit(data) {
  const byFile = new Map();
  for (const test of data.tests) {
    if (!byFile.has(test.file)) byFile.set(test.file, []);
    byFile.get(test.file).push(test);
  }
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>'];
  const total = data.tests.length;
  const failures = data.tests.filter((t) => t.verdict === 'failed' || t.verdict === 'unexpected-pass').length;
  const skipped = data.tests.filter((t) => t.verdict === 'skipped' || t.verdict === 'did-not-run').length;
  lines.push(`<testsuites name="DIA API consolidated report (${escapeXml(data.meta.mode)} run)" tests="${total}" failures="${failures}" skipped="${skipped}">`);
  const blocked = data.endpoints.filter((e) => e.status === 'BLOCKED');
  lines.push(`  <testsuite name="BLOCKED endpoints (documented, NOT covered, no request made)" tests="0" failures="0" skipped="0">`);
  lines.push('    <properties>');
  for (const e of blocked) {
    lines.push(`      <property name="BLOCKED ${escapeXml(e.method)} ${escapeXml(e.route)}" value="${escapeXml(`${e.blocked ? e.blocked.reason : ''} | to unblock: ${e.blocked ? e.blocked.unblock : ''}`)}"/>`);
  }
  lines.push('    </properties>');
  lines.push('  </testsuite>');
  for (const [file, tests] of byFile) {
    const f = tests.filter((t) => t.verdict === 'failed' || t.verdict === 'unexpected-pass').length;
    const s = tests.filter((t) => t.verdict === 'skipped' || t.verdict === 'did-not-run').length;
    lines.push(`  <testsuite name="${escapeXml(file)}" tests="${tests.length}" failures="${f}" skipped="${s}">`);
    for (const t of tests) {
      lines.push(`    <testcase name="${escapeXml(t.title)}" classname="${escapeXml(file)}" time="${(t.durationMs / 1000).toFixed(3)}">`);
      if (t.verdict === 'known-defect') lines.push('      <properties><property name="known-defect" value="expected failure (test.fail): the defect still reproduces"/></properties>');
      if (t.verdict === 'skipped' || t.verdict === 'did-not-run') lines.push(`      <skipped message="${escapeXml(t.skipReason || t.verdict)}"/>`);
      else if (t.verdict === 'failed') lines.push(`      <failure message="${escapeXml((t.error || 'failed').split('\n')[0].slice(0, 300))}">${escapeXml(t.error || '')}</failure>`);
      else if (t.verdict === 'unexpected-pass') lines.push('      <failure message="known-defect test unexpectedly passed (the defect may be fixed)"/>');
      lines.push('    </testcase>');
    }
    lines.push('  </testsuite>');
  }
  lines.push('</testsuites>');
  return `${lines.join('\n')}\n`;
}

// ---- HTML ----
const STYLE = `
:root{--bg:#f6f7f9;--panel:#fff;--text:#1b1f24;--muted:#5b6570;--line:#d9dee4;--accent:#1f5fbf;
--passed:#116329;--passed-bg:#dafbe1;--failed:#a40e26;--failed-bg:#ffebe9;--blocked:#8a4600;--blocked-bg:#fff1e5;
--missing:#6e4a00;--missing-bg:#fff8c5;--skipped:#3b4350;--skipped-bg:#e8ebef;--defect:#6f2da8;--defect-bg:#f3e8ff;
--notreq:#3b4350;--notreq-bg:#eef0f3;--notrun:#0b5a75;--notrun-bg:#dff3fb}
@media (prefers-color-scheme:dark){:root{--bg:#0f1318;--panel:#171c23;--text:#e6e9ee;--muted:#98a2ae;--line:#2b333d;--accent:#6aa5ff;
--passed:#7ee2a0;--passed-bg:#12301d;--failed:#ff9a9a;--failed-bg:#3a1618;--blocked:#ffb86b;--blocked-bg:#36240f;
--missing:#f0d36b;--missing-bg:#33290b;--skipped:#b8c0cb;--skipped-bg:#252b33;--defect:#d4a9ff;--defect-bg:#2a1a3d;
--notreq:#b8c0cb;--notreq-bg:#222831;--notrun:#7fd0ee;--notrun-bg:#0e2b36}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
header,main{max-width:1500px;margin:0 auto;padding:16px}h1{margin:0 0 4px;font-size:22px}h2{margin:28px 0 8px;font-size:17px}
.muted{color:var(--muted)}.banner{padding:10px 14px;border-radius:8px;border:1px solid var(--line);margin:10px 0;background:var(--panel)}
.banner.warn{border-color:var(--blocked);background:var(--blocked-bg);color:var(--blocked)}.banner.bad{border-color:var(--failed);background:var(--failed-bg);color:var(--failed)}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.card{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:10px 12px}
.card b{display:block;font-size:22px}.card span{color:var(--muted);font-size:12px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin:8px 0}
.badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.2px;white-space:nowrap}
.s-PASSED{color:var(--passed);background:var(--passed-bg)}.s-FAILED{color:var(--failed);background:var(--failed-bg)}.s-BLOCKED{color:var(--blocked);background:var(--blocked-bg)}
.s-MISSING{color:var(--missing);background:var(--missing-bg)}.s-SKIPPED{color:var(--skipped);background:var(--skipped-bg)}.s-DEFECT-ONLY{color:var(--defect);background:var(--defect-bg)}
.s-NOT-REQUIRED{color:var(--notreq);background:var(--notreq-bg)}.s-NOT-RUN{color:var(--notrun);background:var(--notrun-bg)}
.t-passed{color:var(--passed);background:var(--passed-bg)}.t-failed,.t-unexpected-pass{color:var(--failed);background:var(--failed-bg)}.t-skipped,.t-did-not-run{color:var(--skipped);background:var(--skipped-bg)}
.t-known-defect{color:var(--defect);background:var(--defect-bg)}.t-flaky{color:var(--missing);background:var(--missing-bg)}
.drift{color:var(--blocked);background:var(--blocked-bg)}.info{color:var(--notrun);background:var(--notrun-bg)}
.filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}
input,select,button{font:inherit;color:var(--text);background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:5px 8px}
button{cursor:pointer}button.on{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset}input[type=search]{min-width:280px}
table{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--line);border-radius:8px;overflow:hidden}
th,td{padding:6px 8px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{position:sticky;top:0;background:var(--panel);font-size:12px;color:var(--muted);z-index:1}
tr.row{cursor:pointer}tr.row:hover{background:var(--bg)}td.route{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all}
tr.detail td{background:var(--bg)}.detail h4{margin:8px 0 4px;font-size:12px;color:var(--muted);text-transform:uppercase}
pre{margin:0;white-space:pre-wrap;word-break:break-word;font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace}
ul{margin:4px 0 4px 18px;padding:0}.scroll{overflow:auto;max-height:70vh}.count{color:var(--muted);margin-left:6px}
@media (max-width:700px){input[type=search]{min-width:0;width:100%}th:nth-child(n+5),td:nth-child(n+5){display:none}}
`;

// Browser-side code. Everything from the data is placed with textContent.
const SCRIPT = `
(function(){
var data=JSON.parse(document.getElementById('report-data').textContent);
var ES=['PASSED','FAILED','BLOCKED','MISSING','SKIPPED','DEFECT-ONLY','NOT REQUIRED','NOT RUN'];
function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined&&text!==null)e.textContent=text;return e}
function cls(s){return s.replace(/ /g,'-')}
function badge(s,prefix){return el('span','badge '+(prefix||'s-')+cls(s),s.toUpperCase&&prefix?s:s)}
function fmt(t){if(!t)return '-';var d=new Date(t);return isNaN(d)?t:d.toLocaleString()+' ('+t+')'}
var m=data.meta;
document.getElementById('title').textContent='DIA API consolidated report';
document.getElementById('sub').textContent=(m.mode==='full'?'Full-suite run':'PARTIAL run')+' | started '+fmt(m.startedAt)+' | duration '+(m.durationMs/1000).toFixed(1)+' s | Playwright '+m.playwright+' | target '+m.targetHost;
var ban=document.getElementById('banners');
function banner(text,kind){var b=el('div','banner '+(kind||''),text);ban.appendChild(b)}
if(m.slot==='partial')banner('PARTIAL RUN - this report covers only part of the suite ('+m.partialReasons.join('; ')+'). It never replaces the full-suite report. Endpoints this run did not reach show NOT RUN.','warn');
if(m.slot==='failed-full')banner('This complete full-suite run had unexpected test failures. It is published separately and did NOT replace the main report; the last fully successful full-suite report stays at /.','bad');
banner('Inventory = routes read statically from the QA backend source (not verified to be what the gateway on :8081 serves). Endpoint statuses below come from this run only; an endpoint is PASSED only if a test-body request reached it and the test passed. HTTP status codes shown are the ones actually recorded; none are inferred.');
// summary
function cards(host,items){items.forEach(function(i){var c=el('div','card');c.appendChild(el('b','',String(i[1])));c.appendChild(el('span','',i[0]));host.appendChild(c)})}
var tc=data.testCounts;
cards(document.getElementById('test-cards'),[['Tests executed (total)',tc.total],['Passed',tc.passed],['Failed (unexpected)',tc.failed],['Skipped',tc.skipped],['Flaky',tc.flaky],['Known-defect (expected failures)',tc.knownDefect],['Defect test unexpectedly passed',tc.unexpectedPass],['Did not run',tc.didNotRun]]);
var ec=data.endpointCounts;
cards(document.getElementById('endpoint-cards'),[['Endpoints in inventory',data.endpoints.length]].concat(ES.map(function(s){return [s,ec[s]||0]})));
var cov=data.coverage;
document.getElementById('coverage-text').textContent='Runtime endpoint coverage = PASSED / (all endpoints - NOT REQUIRED) = '+cov.passed+' / ('+cov.total+' - '+cov.notRequired+') = '+cov.percent.toFixed(1)+'%. '+cov.note;
var inv=data.inventory;
document.getElementById('doc-text').textContent='Documented (static) classification of the same inventory, for comparison only: '+Object.keys(inv.counts).map(function(k){return k+' '+inv.counts[k]}).join(', ')+' (generated '+inv.generated+').';
// endpoint filters
var state={q:'',method:'',module:'',statuses:{},drift:false};
var methods={},modules={};data.endpoints.forEach(function(e){methods[e.method]=1;modules[e.area]=1});
var msel=document.getElementById('f-method');Object.keys(methods).sort().forEach(function(x){var o=el('option','',x);o.value=x;msel.appendChild(o)});
var dsel=document.getElementById('f-module');Object.keys(modules).sort().forEach(function(x){var o=el('option','',x);o.value=x;dsel.appendChild(o)});
var chips=document.getElementById('f-status');
ES.forEach(function(s){var b=el('button','',s+' ('+(ec[s]||0)+')');b.onclick=function(){state.statuses[s]=!state.statuses[s];b.className=state.statuses[s]?'on':'';apply()};chips.appendChild(b)});
var tbody=document.getElementById('ep-body');var rows=[];
function detailFor(e){
 var d=el('div');
 function section(t){d.appendChild(el('h4','',t))}
 section('Documented inventory classification');d.appendChild(el('div','',e.documented+' | priority '+e.priority+(e.negativeOnly?' | documented as negative-only (happy path not exercised)':'')+(e.sourceFile?' | source '+e.sourceFile:'')));
 if(e.blocked){section('BLOCKED');d.appendChild(el('div','','Reason: '+e.blocked.reason));d.appendChild(el('div','','To unblock: '+e.blocked.unblock))}
 if(e.note&&!e.blocked){section('Inventory note');d.appendChild(el('div','',e.note))}
 if(e.drift.length){section('Documentation drift (inventory not changed)');var u=el('ul');e.drift.forEach(function(x){u.appendChild(el('li','',x))});d.appendChild(u)}
 if(e.failures.length){section('Failure reason / assertion details');e.failures.forEach(function(f){d.appendChild(el('div','',f.test+' ('+f.verdict+')'+(f.lastRequest?' | last request in that test: '+f.lastRequest:'')));if(f.message)d.appendChild(el('pre','',f.message))})}
 section('Associated tests (test-body requests)');
 if(!e.tests.length)d.appendChild(el('div','muted','No test-body request reached this endpoint in this run.'));
 else{var ul=el('ul');e.tests.forEach(function(t){var li=el('li');li.appendChild(badge(t.verdict,'t-'));li.appendChild(document.createTextNode(' '+t.title+' - '+t.file+' | HTTP '+t.statuses.join(', ')));ul.appendChild(li)});d.appendChild(ul);if(e.moreTests)d.appendChild(el('div','muted','+ '+e.moreTests+' more tests'))}
 if(e.nonQualifying&&e.nonQualifying.count){section('Other requests (setup, cleanup, fixtures: NOT coverage evidence)');d.appendChild(el('div','',e.nonQualifying.count+' request(s), HTTP '+Object.keys(e.nonQualifying.statuses).map(function(k){return k+' x'+e.nonQualifying.statuses[k]}).join(', ')))}
 return d}
data.endpoints.forEach(function(e){
 var tr=el('tr','row');var td;
 td=el('td');td.appendChild(badge(e.status));tr.appendChild(td);
 tr.appendChild(el('td','',e.method));
 td=el('td','route');td.appendChild(document.createTextNode(e.route));if(m.baseUrl)td.appendChild(el('div','muted',m.baseUrl+e.route));tr.appendChild(td);
 tr.appendChild(el('td','',e.area));
 var codes=Object.keys(e.httpStatuses);tr.appendChild(el('td','',codes.length?codes.map(function(k){return k+(e.httpStatuses[k]>1?' x'+e.httpStatuses[k]:'')}).join(', '):'-'));
 tr.appendChild(el('td','',e.tests.length?String(e.tests.length+(e.moreTests||0)):'-'));
 tr.appendChild(el('td','',e.lastRequestAt?fmt(e.lastRequestAt):'-'));
 td=el('td');if(e.blocked)td.appendChild(el('div','',e.blocked.reason));
 e.drift.forEach(function(x){var b=el('span','badge drift','DRIFT');b.title=x;td.appendChild(b);td.appendChild(document.createTextNode(' '))});
 if(e.status==='FAILED'&&e.failures.length)td.appendChild(el('div','',(e.failures[0].message||'').split('\\n')[0].slice(0,160)));
 tr.appendChild(td);
 var dr=el('tr','detail');dr.hidden=true;var dtd=el('td');dtd.colSpan=8;dr.appendChild(dtd);var built=false;
 tr.onclick=function(){if(!built){dtd.appendChild(detailFor(e));built=true}dr.hidden=!dr.hidden};
 tbody.appendChild(tr);tbody.appendChild(dr);rows.push({e:e,tr:tr,dr:dr,hay:(e.method+' '+(m.baseUrl||'')+e.route+' '+e.area+' '+e.status).toLowerCase()});
});
function apply(){
 var any=Object.keys(state.statuses).some(function(k){return state.statuses[k]});var shown=0;
 rows.forEach(function(r){var e=r.e;var ok=(!state.q||r.hay.indexOf(state.q)>=0)&&(!state.method||e.method===state.method)&&(!state.module||e.area===state.module)&&(!any||state.statuses[e.status])&&(!state.drift||e.drift.length>0);
  r.tr.hidden=!ok;if(!ok)r.dr.hidden=true;if(ok)shown++});
 document.getElementById('ep-count').textContent=shown+' of '+rows.length+' endpoints shown'}
document.getElementById('f-q').oninput=function(ev){state.q=ev.target.value.trim().toLowerCase();apply()};
msel.onchange=function(){state.method=msel.value;apply()};dsel.onchange=function(){state.module=dsel.value;apply()};
document.getElementById('f-drift').onchange=function(ev){state.drift=ev.target.checked;apply()};
document.getElementById('f-reset').onclick=function(){state={q:'',method:'',module:'',statuses:{},drift:false};document.getElementById('f-q').value='';msel.value='';dsel.value='';document.getElementById('f-drift').checked=false;Array.prototype.forEach.call(chips.children,function(b){b.className=''});apply()};
apply();
// tests table
var TS=['passed','failed','skipped','flaky','known-defect','unexpected-pass','did-not-run'];
var ts={q:'',v:''};var tb=document.getElementById('t-body');var trows=[];
var tsel=document.getElementById('t-verdict');TS.forEach(function(x){var o=el('option','',x);o.value=x;tsel.appendChild(o)});
data.tests.forEach(function(t){
 var tr=el('tr','row');var td=el('td');td.appendChild(badge(t.verdict,'t-'));tr.appendChild(td);
 tr.appendChild(el('td','',t.title));tr.appendChild(el('td','',t.file+(t.line?':'+t.line:'')));
 tr.appendChild(el('td','',(t.durationMs/1000).toFixed(2)+' s'));
 tr.appendChild(el('td','',t.endpoints.length?t.endpoints.join('; '):'-'));
 var dr=el('tr','detail');dr.hidden=true;var dtd=el('td');dtd.colSpan=5;dr.appendChild(dtd);var built=false;
 tr.onclick=function(){if(!built){var d=el('div');if(t.skipReason)d.appendChild(el('div','','Skip reason: '+t.skipReason));if(t.error){d.appendChild(el('h4','','Error (redacted)'));d.appendChild(el('pre','',t.error))}if(t.annotations.length){d.appendChild(el('h4','','Annotations'));var u=el('ul');t.annotations.forEach(function(a){u.appendChild(el('li','',a))});d.appendChild(u)}
  d.appendChild(el('h4','','Test-body requests'));if(!t.requests.length)d.appendChild(el('div','muted','none recorded'));else{var ul=el('ul');t.requests.forEach(function(r){ul.appendChild(el('li','',r.method+' '+r.path+' -> HTTP '+r.status+(r.matched?'':' (no inventory route matched)')))});d.appendChild(ul)}
  dtd.appendChild(d);built=true}dr.hidden=!dr.hidden};
 tb.appendChild(tr);tb.appendChild(dr);trows.push({t:t,tr:tr,dr:dr,hay:(t.title+' '+t.file).toLowerCase()});
});
function applyT(){var n=0;trows.forEach(function(r){var ok=(!ts.q||r.hay.indexOf(ts.q)>=0)&&(!ts.v||r.t.verdict===ts.v);r.tr.hidden=!ok;if(!ok)r.dr.hidden=true;if(ok)n++});document.getElementById('t-count').textContent=n+' of '+trows.length+' tests shown'}
document.getElementById('t-q').oninput=function(ev){ts.q=ev.target.value.trim().toLowerCase();applyT()};tsel.onchange=function(){ts.v=tsel.value;applyT()};applyT();
// diagnostics
var dg=data.diagnostics,dh=document.getElementById('diag');
function dsec(title,items,fmtf){dh.appendChild(el('h4','',title));if(!items.length){dh.appendChild(el('div','muted','none'));return}var u=el('ul');items.forEach(function(i){u.appendChild(el('li','',fmtf(i)))});dh.appendChild(u)}
dsec('Test-body requests that matched no inventory route (e.g. deliberate 404 probes, wrong converter types)',dg.unmatched,function(i){return i.method+' '+i.path+' -> HTTP '+i.status+' x'+i.count});
dsec('Ambiguous matches (not credited to any endpoint)',dg.ambiguous,function(i){return i.method+' '+i.path+' could be '+i.candidates.join(' or ')});
dsec('Requests to other hosts (not DIA)',[{n:dg.externalRequests}].filter(function(x){return x.n>0}),function(i){return i.n+' request(s) ignored'});
dh.appendChild(el('h4','','Non-test requests (setup, cleanup, fixtures)'));dh.appendChild(el('div','',dg.nonTestRequests+' recorded for diagnostics; they never make an endpoint PASSED. Requests made by a worker\\'s final cleanup hook after its last test are not retained.'));
var un=data.inventory.unverifiedDevOnly;var uh=document.getElementById('unverified');
un.forEach(function(u){uh.appendChild(el('li','',u.method+' '+u.route))});
// auto refresh: when the server publishes a newer report for this slot, reload
var slot=m.slot;
function poll(){fetch('/_status',{cache:'no-store'}).then(function(r){return r.json()}).then(function(s){var cur=s[slot];if(cur&&cur.runId&&cur.runId!==m.runId)location.reload()}).catch(function(){})}
if(location.protocol.indexOf('http')===0)setInterval(poll,5000);
})();
`;

function renderHtml(data) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c').split(String.fromCharCode(0x2028)).join('\\u2028').split(String.fromCharCode(0x2029)).join('\\u2029');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'">
<title>DIA API consolidated report</title>
<style>${STYLE}</style>
</head>
<body>
${MARKER}
<header><h1 id="title"></h1><div class="muted" id="sub"></div><div id="banners"></div></header>
<main>
<h2>Test execution results</h2>
<p class="muted">What happened to each Playwright test in this run. Separate from endpoint coverage below.</p>
<div class="cards" id="test-cards"></div>

<h2>Endpoint coverage (from this run)</h2>
<div class="cards" id="endpoint-cards"></div>
<div class="panel"><div id="coverage-text"></div><div class="muted" id="doc-text"></div></div>

<h2>Endpoints</h2>
<div class="filters">
<input id="f-q" type="search" placeholder="Search route, method, module or status" aria-label="Search endpoints">
<select id="f-method" aria-label="Method"><option value="">All methods</option></select>
<select id="f-module" aria-label="Module"><option value="">All modules</option></select>
<label><input id="f-drift" type="checkbox"> documentation drift only</label>
<button id="f-reset" type="button">Reset</button><span class="count" id="ep-count"></span>
</div>
<div class="filters" id="f-status" aria-label="Status filter"></div>
<div class="scroll"><table>
<thead><tr><th>Status</th><th>Method</th><th>Route / URL</th><th>Module</th><th>HTTP codes (recorded)</th><th>Tests</th><th>Last request</th><th>Reason / blocker / drift</th></tr></thead>
<tbody id="ep-body"></tbody></table></div>

<h2>Test cases</h2>
<div class="filters"><input id="t-q" type="search" placeholder="Search test title or file" aria-label="Search tests">
<select id="t-verdict" aria-label="Test result"><option value="">All results</option></select><span class="count" id="t-count"></span></div>
<div class="scroll"><table>
<thead><tr><th>Result</th><th>Test</th><th>File</th><th>Time</th><th>Endpoints reached (test body)</th></tr></thead>
<tbody id="t-body"></tbody></table></div>

<h2>Diagnostics</h2>
<div class="panel" id="diag"></div>

<h2>Not counted: routes found only in the development tree</h2>
<div class="panel"><div class="muted">Present in /home/dia/backend but not in the QA source. Not part of the inventory above and not classified; listed for visibility only.</div><ul id="unverified"></ul></div>
</main>
<script type="application/json" id="report-data">${json}</script>
<script>${SCRIPT}</script>
</body>
</html>
`;
}

module.exports = { renderHtml, renderJunit, MARKER };
