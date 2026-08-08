import assert from 'node:assert/strict';
import { loadSpec, check } from './spec.js';

process.env.FIXTURE_ADDRESS ??= '0xfc8cb154446563CdCD1c73996918Cd4459a8d176';

// --- check(): the comparison the whole verdict rests on ---
assert.equal(check({ op: 'eq', delta: '1' }, 6n, 5n).pass, true, 'delta 1 on 5 -> 6 passes');
assert.equal(check({ op: 'eq', delta: '1' }, 5n, 5n).pass, false, 'unchanged state fails delta 1');
assert.equal(check({ op: 'gte', value: '0' }, 0n, 0n).pass, true);
assert.equal(check({ op: 'lte', value: '3' }, 4n, 0n).pass, false);
assert.equal(check({ op: 'eq', value: true }, true, true).pass, true, 'bool readings compare by eq');
assert.throws(() => check({ op: 'gte', value: true }, true, true), /numeric/);

// --- loadSpec(): every shipped spec parses, and bad specs fail loudly ---
for (const f of ['01-baseline-increment', '02-revert-fail-closed', '03-silent-failure']) {
  const s = loadSpec(new URL(`../specs/${f}.json`, import.meta.url).pathname);
  assert.equal(s.action.item.name, 'increment');
  assert.equal(s.read.outputs.length, 1);
  assert.equal(s.postcondition.delta, '1', `${f}: postcondition states the intended effect`);
}

const tmp = new URL('../evidence/bad-spec.json', import.meta.url).pathname;
const { writeFileSync, mkdirSync, rmSync } = await import('node:fs');
mkdirSync(new URL('../evidence/', import.meta.url).pathname, { recursive: true });
const bad = (obj) => {
  writeFileSync(tmp, JSON.stringify(obj));
  return () => loadSpec(tmp);
};
const base = {
  name: 'x',
  chainId: 11155111,
  contract: '$FIXTURE_ADDRESS',
  read: 'function count() view returns (uint256)',
  action: { sig: 'function increment()' },
  postcondition: { op: 'eq', delta: '1' },
};
assert.throws(bad({ ...base, contract: 'not-an-address' }), /not an address/);
assert.throws(bad({ ...base, postcondition: { op: 'wat', value: '1' } }), /op must be one of/);
assert.throws(bad({ ...base, postcondition: { op: 'eq' } }), /exactly one of value\|delta/);
assert.throws(bad({ ...base, precondition: { op: 'eq', delta: '1' } }), /delta is only allowed/);
assert.throws(bad({ ...base, read: 'function noop()' }), /must return a value/);
assert.throws(bad({ ...base, expectVerdict: 'green' }), /expectVerdict must be/);
assert.throws(bad({ ...base, action: { sig: 'gibberish' } }), /not a valid signature/);
rmSync(tmp);

console.log('spec.test.js — all assertions passed');
