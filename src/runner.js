import { mkdirSync, writeFileSync } from 'node:fs';
import { loadSpec, check } from './spec.js';
import { makeClients, readState, directWrite } from './chain.js';
import {
  buildWorkflow,
  createWorkflow,
  executeWorkflow,
  waitForExecution,
  executionLogs,
} from './keeperhub.js';
import { renderReport } from './report.js';
import { readClaim, verdictOf, recoveryOwnerOf } from './verdict.js';

// Evidence is meant to be published. KeeperHub's execution record carries account
// identifiers and the caller's IP; none of it is needed to check a claim against
// the chain, and all of it would ship to whoever reads the report.
const REDACTED = new Set([
  'userId',
  'organizationId',
  'triggeredByUserApiKeyId',
  'triggeredByOrgApiKeyId',
  'triggeredByIp',
  'dispatchKey',
]);

const jsonSafe = (k, v) => {
  if (REDACTED.has(k)) return v == null ? v : '[redacted]';
  return typeof v === 'bigint' ? v.toString() : v;
};
const log = (...a) => console.log(...a);

async function runSpec(path) {
  const spec = loadSpec(path);
  const clients = makeClients(spec.chainId);
  const startedAt = new Date().toISOString();
  log(`\n▶ ${spec.name}  (${path})`);

  if (spec.setup) {
    const r = await directWrite(clients, spec, spec.setup);
    log(`  setup   ${spec.setup.item.name}(${spec.setup.args}) → ${r.status} ${r.transactionHash}`);
  }

  let observed = false;
  try {
    const result = await observe(clients, spec, path, startedAt);
    observed = true;
    return result;
  } finally {
    // Always unwind the fixture, even when the API/RPC blew up mid-run — a
    // paused fixture left behind poisons every spec that runs after it.
    if (spec.teardown) {
      const err = await directWrite(clients, spec, spec.teardown).then(
        (r) => (log(`  teardown ${spec.teardown.item.name}(${spec.teardown.args}) → ${r.status}`), null),
        (e) => (log(`  teardown FAILED: ${e.message}`), e),
      );
      // A fixture left in an unknown state invalidates every later spec, so this
      // cannot stay a log line. Only raise it when nothing is already failing —
      // an unwind error must never bury the failure that caused it.
      if (err && observed) throw new Error(`teardown failed, fixture state unknown: ${err.message}`);
    }
  }
}

async function observe(clients, spec, path, startedAt) {
  const pre = await readState(clients, spec);
  log(`  pre     ${spec.read.name}() = ${pre}`);

  const preCheck = spec.precondition ? check(spec.precondition, pre, pre) : { pass: true };
  if (!preCheck.pass) throw new Error(`precondition failed: ${pre} vs ${JSON.stringify(spec.precondition)}`);

  const workflow = await createWorkflow(buildWorkflow(spec));
  const { executionId } = await executeWorkflow(workflow.id);
  log(`  exec    workflow ${workflow.id} → execution ${executionId}`);

  const wait = await waitForExecution(executionId);
  const logs = await executionLogs(executionId).catch((e) => ({ error: e.message }));
  const claim = readClaim(wait);
  log(`  claim   status=${claim.status} output.success=${claim.outputSuccess} tx=${claim.transactionHashes.length}`);

  const post = await readState(clients, spec);
  const assertion = check(spec.postcondition, post, pre);
  log(`  post    ${spec.read.name}() = ${post}  expected ${spec.postcondition.op} ${assertion.target} → ${assertion.pass ? 'PASS' : 'FAIL'}`);

  const verdict = verdictOf(claim, assertion.pass);
  const recoveryOwner = recoveryOwnerOf(claim);
  const asExpected = verdict === spec.expectVerdict && recoveryOwner === spec.recovery;
  log(`  VERDICT ${verdict.toUpperCase()} (expected ${spec.expectVerdict}) recoveryOwner=${recoveryOwner} (expected ${spec.recovery}) → ${asExpected ? 'OK' : 'MISMATCH'}`);

  return {
    spec: { ...spec, path },
    startedAt,
    completedAt: new Date().toISOString(),
    workflowId: workflow.id,
    executionId,
    claim,
    state: { pre, post, expected: assertion.target, assertionPass: assertion.pass },
    verdict,
    expectVerdict: spec.expectVerdict,
    asExpected,
    recovery: { expected: spec.recovery, observed: recoveryOwner, match: spec.recovery === recoveryOwner },
    raw: { wait, logs },
  };
}

const paths = process.argv.slice(2);
if (!paths.length) {
  console.error('usage: node --env-file=.env src/runner.js specs/*.json');
  process.exit(2);
}

const results = [];
for (const p of paths) {
  try {
    results.push(await runSpec(p));
  } catch (e) {
    console.error(`  ERROR   ${p}: ${e.message}`);
    results.push({ spec: { path: p }, verdict: 'runner-error', asExpected: false, error: e.message });
  }
}

// Exit 0 means every spec observed the behaviour it declared — including the
// specs that declare a silent failure. Surprise is the only failure mode.
const bad = results.filter((r) => !r.asExpected);

// The filename carries the outcome. A run that blew up must never sit in the
// directory looking exactly like a clean one — that is how a throwaway 401 test
// gets mistaken for a broken demo.
mkdirSync('evidence', { recursive: true });
const tag = results.some((r) => r.verdict === 'runner-error') ? 'ERRORED' : bad.length ? 'MISMATCH' : 'ok';
const out = `evidence/run-${Date.now()}-${tag}`;
writeFileSync(`${out}.json`, JSON.stringify(results, jsonSafe, 2));
writeFileSync(`${out}.html`, renderReport(JSON.parse(JSON.stringify(results, jsonSafe))));
log(`\nEvidence → ${out}.json  ·  ${out}.html`);

if (bad.length) log(`${bad.length}/${results.length} spec(s) off-expectation: ${bad.map((r) => r.verdict).join(', ')}`);
process.exit(bad.length ? 1 : 0);
