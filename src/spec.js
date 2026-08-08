import { readFileSync } from 'node:fs';
import { parseAbi, isAddress } from 'viem';

const OPS = ['eq', 'neq', 'gte', 'lte'];
const VERDICTS = ['verified', 'silent-failure', 'honest-failure', 'unreported-success'];

/** `$FIXTURE_ADDRESS` -> process.env.FIXTURE_ADDRESS */
const resolveEnv = (v) =>
  typeof v === 'string' && v.startsWith('$')
    ? process.env[v.slice(1)] ?? fail(`env ${v.slice(1)} is not set (spec referenced ${v})`)
    : v;

const fail = (msg) => {
  throw new Error(`spec: ${msg}`);
};

/** Human-readable solidity signature -> viem AbiItem. Throws on malformed input. */
const toAbiItem = (sig, where) => {
  if (typeof sig !== 'string') fail(`${where}.sig must be a string`);
  try {
    return parseAbi([sig])[0];
  } catch (e) {
    fail(`${where}.sig is not a valid signature: ${sig} (${e.message})`);
  }
};

const validateExpect = (e, where, { allowDelta }) => {
  if (!e || typeof e !== 'object') fail(`${where} must be an object`);
  if (!OPS.includes(e.op)) fail(`${where}.op must be one of ${OPS.join('|')}, got ${e.op}`);
  const hasValue = e.value !== undefined;
  const hasDelta = e.delta !== undefined;
  if (hasValue === hasDelta) fail(`${where} needs exactly one of value|delta`);
  if (hasDelta && !allowDelta) fail(`${where}.delta is only allowed on postcondition`);
  return { op: e.op, ...(hasValue ? { value: e.value } : { delta: e.delta }) };
};

/** Parse + validate a spec file. Fails loudly; a half-valid spec produces a false verdict. */
export function loadSpec(path) {
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    fail(`cannot read ${path}: ${e.message}`);
  }

  if (!raw.name || typeof raw.name !== 'string') fail('name is required');
  const contract = resolveEnv(raw.contract);
  if (!isAddress(contract)) fail(`contract is not an address: ${contract}`);
  if (!Number.isInteger(raw.chainId)) fail('chainId must be an integer');
  if (!raw.action || typeof raw.action !== 'object') fail('action is required');
  // `runproof` is intentionally absent: RunProof does not retry, so no evidence could
  // ever produce it. See the note on recoveryOwnerOf in verdict.js.
  if (raw.recovery && !['keeperhub', 'none'].includes(raw.recovery.expect))
    fail(`recovery.expect must be keeperhub|none, got ${raw.recovery.expect}`);
  if (raw.expectVerdict && !VERDICTS.includes(raw.expectVerdict))
    fail(`expectVerdict must be one of ${VERDICTS.join('|')}, got ${raw.expectVerdict}`);

  const readItem = toAbiItem(raw.read, 'read');
  if (!readItem.outputs?.length) fail('read must return a value');

  return {
    name: raw.name,
    description: raw.description ?? '',
    chainId: raw.chainId,
    contract,
    setup: raw.setup
      ? { item: toAbiItem(raw.setup.sig, 'setup'), args: raw.setup.args ?? [] }
      : null,
    teardown: raw.teardown
      ? { item: toAbiItem(raw.teardown.sig, 'teardown'), args: raw.teardown.args ?? [] }
      : null,
    read: readItem,
    precondition: raw.precondition
      ? validateExpect(raw.precondition, 'precondition', { allowDelta: false })
      : null,
    action: {
      item: toAbiItem(raw.action.sig, 'action'),
      args: raw.action.args ?? [],
      failOnError: raw.action.failOnError ?? true,
    },
    // The postcondition states what a *successful* action would have done, always.
    // A failing spec still declares delta 1 — that mismatch is what exposes the claim.
    postcondition: validateExpect(raw.postcondition, 'postcondition', { allowDelta: true }),
    recovery: raw.recovery?.expect ?? 'none',
    // What this spec asserts KeeperHub will do. A spec that documents the
    // failOnError trap expects `silent-failure` and passes when it sees it.
    expectVerdict: raw.expectVerdict ?? 'verified',
  };
}

/**
 * Compare an on-chain reading against an expectation.
 * `delta` is relative to `pre`; `value` is absolute. Numbers compare as BigInt.
 */
export function check(expect, actual, pre) {
  const num = (v) => (typeof v === 'bigint' ? v : BigInt(String(v)));
  const target = expect.delta !== undefined ? num(pre) + num(expect.delta) : expect.value;

  // Non-numeric readings (bool, string, address) only support eq/neq.
  const isNumeric = typeof actual === 'bigint' || typeof actual === 'number';
  if (!isNumeric) {
    if (expect.op === 'eq') return { pass: String(actual) === String(target), target };
    if (expect.op === 'neq') return { pass: String(actual) !== String(target), target };
    fail(`op ${expect.op} needs a numeric reading, got ${typeof actual}`);
  }

  const a = num(actual);
  const t = num(target);
  const pass = { eq: a === t, neq: a !== t, gte: a >= t, lte: a <= t }[expect.op];
  return { pass, target: t };
}
