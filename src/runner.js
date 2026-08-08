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

const jsonSafe = (_, v) => (typeof v === 'bigint' ? v.toString() : v);
const log = (...a) => console.log(...a);

/**
 * What KeeperHub claims happened, taken at face value from the execution record.
 * `output.success: true` alongside `error` set is exactly the trap the gate found.
 */
const readClaim = (wait) => ({
  status: wait.status,
  outputSuccess: wait.output?.success ?? null,
  error: wait.error ?? wait.output?.error ?? null,
  transactionHashes: (wait.transactionHashes ?? []).map((t) => t.hash),
  gasUsed: wait.output?.gasUsedUnits ?? wait.output?.gasUsed ?? null,
  sponsored: wait.output?.sponsored ?? null,
  link: wait.output?.transactionLink ?? null,
});

/**
 * Cross the claim against independently read state.
 * `silent-failure` is the finding RunProof exists to catch: reported success,
 * nothing changed on chain.
 */
function verdictOf(claim, assertionPass) {
  const claimed = claim.status === 'success' && claim.outputSuccess !== false;
  if (claimed) return assertionPass ? 'verified' : 'silent-failure';
  return assertionPass ? 'unreported-success' : 'honest-failure';
}

/** Who actually recovered, judged only by what is visible in the evidence. */
const recoveryOwnerOf = (claim) => {
  if (claim.transactionHashes.length > 1) return 'keeperhub'; // retry lands as extra hashes
  if (claim.transactionHashes.length === 0) return 'none'; // never broadcast, nothing to recover
  return 'none';
};

async function runSpec(path) {
  const spec = loadSpec(path);
  const clients = makeClients(spec.chainId);
  const startedAt = new Date().toISOString();
  log(`\n▶ ${spec.name}  (${path})`);

  if (spec.setup) {
    const r = await directWrite(clients, spec, spec.setup);
    log(`  setup   ${spec.setup.item.name}(${spec.setup.args}) → ${r.status} ${r.transactionHash}`);
  }

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

  if (spec.teardown) {
    const r = await directWrite(clients, spec, spec.teardown);
    log(`  teardown ${spec.teardown.item.name}(${spec.teardown.args}) → ${r.status}`);
  }

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

mkdirSync('evidence', { recursive: true });
const out = `evidence/run-${Date.now()}`;
writeFileSync(`${out}.json`, JSON.stringify(results, jsonSafe, 2));
writeFileSync(`${out}.html`, renderReport(JSON.parse(JSON.stringify(results, jsonSafe))));
log(`\nEvidence → ${out}.json  ·  ${out}.html`);

// Exit 0 means every spec observed the behaviour it declared — including the
// specs that declare a silent failure. Surprise is the only failure mode.
const bad = results.filter((r) => !r.asExpected);
if (bad.length) log(`${bad.length}/${results.length} spec(s) off-expectation: ${bad.map((r) => r.verdict).join(', ')}`);
process.exit(bad.length ? 1 : 0);
