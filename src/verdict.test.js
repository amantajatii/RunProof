import assert from 'node:assert/strict';
import { readClaim, verdictOf, recoveryOwnerOf } from './verdict.js';

// Real payloads, copied from raw/ during the gate. If KeeperHub changes shape,
// these stop matching and that is exactly the signal we want.
const SUCCESS = {
  status: 'success',
  output: {
    success: true,
    sponsored: true,
    gasUsedUnits: '67914',
    transactionLink: 'https://sepolia.etherscan.io/tx/0x5e54',
  },
  error: null,
  transactionHashes: [{ hash: '0x5e54', receiptStatus: 'success' }],
};

// The trap: status success, output.success true, and an error nobody reads.
const SILENT = {
  status: 'success',
  output: { success: true, error: 'Contract call failed: Error(paused)' },
  error: null,
  transactionHashes: [],
};

const HONEST = {
  status: 'error',
  output: null,
  error: 'Contract call failed: Error(paused)',
  transactionHashes: [],
};

// --- readClaim: pull the claim out without interpreting it ---
const s = readClaim(SUCCESS);
assert.equal(s.status, 'success');
assert.equal(s.outputSuccess, true);
assert.deepEqual(s.transactionHashes, ['0x5e54']);
assert.equal(s.gasUsed, '67914');
assert.equal(s.error, null);

const silent = readClaim(SILENT);
assert.equal(silent.outputSuccess, true, 'claims success');
assert.equal(silent.error, 'Contract call failed: Error(paused)', 'error is dug out of output');
assert.deepEqual(silent.transactionHashes, [], 'nothing was ever broadcast');

assert.equal(readClaim(HONEST).error, 'Contract call failed: Error(paused)');
assert.equal(readClaim({ status: 'running' }).gasUsed, null, 'missing fields degrade to null');

// --- verdictOf: the 2x2 that is the whole product ---
assert.equal(verdictOf(readClaim(SUCCESS), true), 'verified');
assert.equal(verdictOf(readClaim(SILENT), false), 'silent-failure');
assert.equal(verdictOf(readClaim(HONEST), false), 'honest-failure');
assert.equal(verdictOf(readClaim(HONEST), true), 'unreported-success');
// A success claim whose state did not move is a silent failure even with a tx on chain:
// the transaction landed, it just did not do what the spec promised.
assert.equal(verdictOf(readClaim(SUCCESS), false), 'silent-failure');
// output.success explicitly false outranks a success status.
assert.equal(
  verdictOf(readClaim({ status: 'success', output: { success: false } }), false),
  'honest-failure'
);

// --- recoveryOwnerOf: only what the evidence shows ---
assert.equal(recoveryOwnerOf({ transactionHashes: [] }), 'none', 'never broadcast');
assert.equal(recoveryOwnerOf({ transactionHashes: ['0xa'] }), 'none', 'one tx is not a retry');
assert.equal(recoveryOwnerOf({ transactionHashes: ['0xa', '0xb'] }), 'keeperhub', 'retry = 2 hashes');

console.log('verdict.test.js — all assertions passed');
