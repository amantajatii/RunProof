# RunProof

A reported success is only a claim until the chain agrees.

RunProof runs a declarative spec against a KeeperHub workflow, then reads the contract
state **itself** — over its own RPC, with viem, never through KeeperHub — and cross-checks
what actually happened against what was reported.

## Why

During the gate experiments (`gate-findings.md`) KeeperHub returned:

```
status: "success"   output.success: true   transactionHashes: []   error: "Contract call failed: Error(paused)"
```

An operation that never happened, reported as a success. The error was there — parked in a
field nobody reads when `status` already says success. Independent state diff catches it in
one line.

## Run it

```bash
pnpm install
cp .env.example .env      # fill in KEEPERHUB_API_KEY, SEPOLIA_RPC_URL, FIXTURE_ADDRESS, DEPLOYER_PRIVATE_KEY
node --env-file=.env src/runner.js specs/*.json
```

Writes `evidence/run-<ts>.json` (full raw responses) and `evidence/run-<ts>.html`
(a static report, no server, no framework). Exit code 0 means every spec observed the
behaviour it declared — including specs that declare a failure.

`pnpm test` runs the spec-parser and verdict self-checks plus `forge test` on the fixture.

## Spec format

One JSON file per scenario. Signatures are plain Solidity, parsed by viem.

```json
{
  "name": "baseline increment",
  "chainId": 11155111,
  "contract": "$FIXTURE_ADDRESS",
  "setup":  { "sig": "function setPaused(bool p)", "args": [false] },
  "read":   "function count() view returns (uint256)",
  "action": { "sig": "function increment()", "args": [], "failOnError": true },
  "postcondition": { "op": "eq", "delta": "1" },
  "recovery": { "expect": "none" },
  "expectVerdict": "verified"
}
```

- `setup` / `teardown` are RunProof's own transactions, signed with the deployer key and sent
  directly. Arranging the fixture through KeeperHub would let its behaviour mask itself.
- `postcondition` always states what a **successful** action would have done — even in a spec
  that expects to fail. That mismatch is what exposes the claim.
- `recovery.expect` is `keeperhub | runproof | none`. Retries surface as more than one entry in
  `transactionHashes`; there is no `attempt` or `retryCount` field anywhere in the API.

## Verdicts

| | chain agrees | chain disagrees |
|---|---|---|
| **reported success** | `verified` | `silent-failure` |
| **reported failure** | `unreported-success` | `honest-failure` |

## Scenarios

| Spec | KeeperHub claims | On chain | Verdict |
|---|---|---|---|
| `01-baseline-increment` | success, 1 tx | `count` +1 | `verified` |
| `02-revert-fail-closed` | error, 0 tx | unchanged | `honest-failure` |
| `03-silent-failure` | **success, 0 tx** | **unchanged** | `silent-failure` |

Scenario 2 is KeeperHub behaving well: the revert is caught in simulation, nothing is
broadcast, zero gas burned. Scenario 3 is the same execution with `failOnError: false` — and
that is the one worth building a tool for.

## Layout

```
src/spec.js    parse + validate specs, compare readings
src/chain.js   viem clients, independent state reads, fixture setup/teardown
src/keeperhub.js  REST client (kh_ org key) + workflow builder
src/runner.js  orchestrate one spec, decide the verdict, write evidence
src/report.js  evidence JSON → static HTML
```

Transport is REST throughout. The MCP OAuth session threw intermittent 401s during the gate;
the `kh_` org key never failed once. See `TEARDOWN.md`.
