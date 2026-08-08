import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const esc = (s) =>
  String(s ?? '—').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const VERDICT_COPY = {
  verified: ['VERIFIED', 'Reported success, and the chain agrees.'],
  'silent-failure': ['SILENT FAILURE', 'Reported success. Nothing happened on chain.'],
  'honest-failure': ['HONEST FAILURE', 'Reported failure, and nothing happened. Fail-closed.'],
  'unreported-success': ['UNREPORTED SUCCESS', 'Reported failure, but the chain changed anyway.'],
  'runner-error': ['RUNNER ERROR', 'RunProof could not complete this spec.'],
};

const short = (h) => `${h.slice(0, 10)}…${h.slice(-8)}`;
const secondsBetween = (a, b) => ((new Date(b) - new Date(a)) / 1000).toFixed(1);

/** One row of the "what happened, in order" timeline. */
const step = (label, detail, tone = '') =>
  `<li class="${tone}"><span class="k">${esc(label)}</span><span class="v">${detail}</span></li>`;

function card(r) {
  if (r.verdict === 'runner-error') {
    return `<section class="card err">
      <h2>${esc(r.spec.path)}</h2>
      <p class="sub">${esc(r.error)}</p>
    </section>`;
  }

  const [title, gloss] = VERDICT_COPY[r.verdict] ?? [r.verdict, ''];
  const c = r.claim;
  const s = r.state;
  const txs = c.transactionHashes;

  const claimLine = c.status === 'success' && c.outputSuccess !== false
    ? `<b>success</b> · output.success <b>${esc(c.outputSuccess)}</b>`
    : `<b>${esc(c.status)}</b>`;

  return `<section class="card ${r.verdict}">
    <header>
      <div>
        <h2>${esc(r.spec.name)}</h2>
        <p class="sub">${esc(r.spec.description)}</p>
      </div>
      <div class="badge">
        <span class="verdict">${esc(title)}</span>
        <span class="expect">${r.asExpected ? 'as declared' : `declared ${esc(r.expectVerdict)}`}</span>
      </div>
    </header>

    <div class="split">
      <div class="pane claim">
        <h3>KeeperHub reports</h3>
        <dl>
          <dt>status</dt><dd>${claimLine}</dd>
          <dt>transactions</dt><dd>${txs.length ? txs.map((h) => `<a href="https://sepolia.etherscan.io/tx/${esc(h)}">${esc(short(h))}</a>`).join(' ') : '<i>none broadcast</i>'}</dd>
          <dt>gas used</dt><dd>${esc(c.gasUsed)}${c.sponsored ? ' <i>(sponsored by relayer)</i>' : ''}</dd>
          <dt>error field</dt><dd>${c.error ? `<b class="bad">${esc(c.error)}</b>` : '<i>null</i>'}</dd>
        </dl>
      </div>
      <div class="pane truth">
        <h3>RunProof reads the chain</h3>
        <dl>
          <dt>before</dt><dd>${esc(r.spec.read.name)}() = <b>${esc(s.pre)}</b></dd>
          <dt>after</dt><dd>${esc(r.spec.read.name)}() = <b>${esc(s.post)}</b></dd>
          <dt>expected</dt><dd>${esc(r.spec.postcondition.op)} <b>${esc(s.expected)}</b></dd>
          <dt>assertion</dt><dd class="${s.assertionPass ? 'ok' : 'bad'}"><b>${s.assertionPass ? 'PASS' : 'FAIL'}</b></dd>
        </dl>
      </div>
    </div>

    <p class="gloss">${esc(gloss)}</p>

    <ol class="timeline">
      ${r.spec.setup ? step('setup', `${esc(r.spec.setup.item.name)}(${esc(r.spec.setup.args)}) — RunProof's own tx, not routed through KeeperHub`) : ''}
      ${step('pre-state', `${esc(r.spec.read.name)}() = ${esc(s.pre)} read over our own RPC`)}
      ${step('execute', `workflow <code>${esc(r.workflowId)}</code> → execution <code>${esc(r.executionId)}</code>`)}
      ${step('claim', claimLine, c.error ? 'warn' : '')}
      ${step('post-state', `${esc(r.spec.read.name)}() = ${esc(s.post)}, expected ${esc(s.expected)}`, s.assertionPass ? 'ok' : 'bad')}
      ${step('recovery', `observed <b>${esc(r.recovery.observed)}</b>, declared <b>${esc(r.recovery.expected)}</b>`)}
      ${step('verdict', `<b>${esc(title)}</b> in ${esc(secondsBetween(r.startedAt, r.completedAt))}s`, r.verdict === 'verified' ? 'ok' : 'bad')}
    </ol>
  </section>`;
}

const CSS = `
:root{--bg:#0e1116;--card:#161b22;--line:#2a313c;--fg:#e6edf3;--dim:#8b949e;--ok:#3fb950;--bad:#f85149;--warn:#d29922}
*{box-sizing:border-box}body{margin:0;padding:2.5rem 1.25rem;background:var(--bg);color:var(--fg);
font:15px/1.55 ui-sans-serif,-apple-system,Segoe UI,sans-serif}
.wrap{max-width:60rem;margin:0 auto}
h1{font-size:1.6rem;margin:0 0 .25rem}
.lede{color:var(--dim);margin:0 0 2rem;max-width:46rem}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem}
.card.silent-failure{border-color:var(--bad)}
.card.verified{border-color:var(--ok)}
header{display:flex;gap:1rem;justify-content:space-between;align-items:flex-start;flex-wrap:wrap}
h2{font-size:1.15rem;margin:0}
.sub{color:var(--dim);margin:.25rem 0 0;font-size:.9rem;max-width:40rem}
.badge{text-align:right}
.verdict{display:block;font-weight:700;letter-spacing:.04em;font-size:.85rem}
.verified .verdict{color:var(--ok)}.silent-failure .verdict{color:var(--bad)}
.honest-failure .verdict{color:var(--warn)}
.expect{color:var(--dim);font-size:.75rem}
.split{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1.25rem 0 .5rem}
@media(max-width:44rem){.split{grid-template-columns:1fr}}
.pane{border:1px solid var(--line);border-radius:8px;padding:.85rem}
.pane h3{margin:0 0 .6rem;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:var(--dim)}
dl{display:grid;grid-template-columns:auto 1fr;gap:.3rem .75rem;margin:0;font-size:.88rem}
dt{color:var(--dim)}dd{margin:0;overflow-wrap:anywhere}
.gloss{color:var(--dim);font-style:italic;margin:.5rem 0 1rem}
.timeline{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.timeline li{display:grid;grid-template-columns:6.5rem 1fr;gap:.75rem;padding:.45rem 0;
border-bottom:1px solid var(--line);font-size:.86rem}
.timeline .k{color:var(--dim);text-transform:uppercase;font-size:.7rem;letter-spacing:.06em;padding-top:.15rem}
.ok,.ok b{color:var(--ok)}.bad,.bad b{color:var(--bad)}.warn,.warn b{color:var(--warn)}
code{background:#0b0e13;padding:.1rem .3rem;border-radius:4px;font-size:.82em}
a{color:#58a6ff}
footer{color:var(--dim);font-size:.8rem;margin-top:2rem}
`;

export function renderReport(results) {
  const counts = results.reduce((a, r) => ({ ...a, [r.verdict]: (a[r.verdict] ?? 0) + 1 }), {});
  const summary = Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(' · ');

  return `<!doctype html><meta charset="utf-8"><title>RunProof — evidence report</title>
<meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}</style>
<div class="wrap">
<h1>RunProof — evidence report</h1>
<p class="lede">Every row below is a claim KeeperHub made, checked against contract state RunProof
read itself over its own RPC. A reported success is only a claim until the chain agrees.
<br><b>${esc(summary)}</b> · ${esc(new Date().toISOString())}</p>
${results.map(card).join('\n')}
<footer>Sepolia · state read with viem, execution driven over the KeeperHub REST API.</footer>
</div>`;
}

// CLI: node src/report.js [evidence/run-*.json]  (defaults to the newest run)
if (import.meta.url === `file://${process.argv[1]}`) {
  const path =
    process.argv[2] ??
    `evidence/${readdirSync('evidence').filter((f) => f.startsWith('run-')).sort().pop()}`;
  const out = path.replace(/\.json$/, '.html');
  writeFileSync(out, renderReport(JSON.parse(readFileSync(path, 'utf8'))));
  console.log(`Report → ${out}`);
}
