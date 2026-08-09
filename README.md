<p align="center">
  <img src="runproof-logo.png" alt="RunProof" width="360">
</p>

A reported success is only a claim until the chain agrees.

RunProof runs a declarative spec against a KeeperHub workflow, then reads the contract
state **itself** — over its own RPC, with viem, never through KeeperHub — and cross-checks
what actually happened against what was reported.

## The catch, from a real run

KeeperHub reported this, on Sepolia, for a call that was never broadcast:

```
status: "success"   output.success: true   transactionHashes: []   error: "Contract call failed: Error(paused)"
```

RunProof read the fixture itself over its own RPC: `count` was **7** before and **7** after,
where a real `increment()` would have left **8**. Verdict: `silent-failure`.

**Open [`evidence/run-1786179412876-ok.html`](evidence/run-1786179412876-ok.html)** — one
committed run, all three scenarios, no server needed. The verified scenario in it is
[tx `0x62c27aaf…`](https://sepolia.etherscan.io/tx/0x62c27aafcfa282f484fc9a33b60d08baf3cd2f8de370c7a1a45ec24456fe7cf1)
against fixture [`0xfc8cb154…`](https://sepolia.etherscan.io/address/0xfc8cb154446563CdCD1c73996918Cd4459a8d176).

## How it verifies

```text
declarative spec
  → KeeperHub workflow execution        (the claim)
  → independent pre/post reads via viem (the fact)
  → claim vs. state comparison          (the verdict)
  → JSON + static HTML evidence
```

The claim and the fact never share a transport. KeeperHub is never asked whether it succeeded.

**What this is and is not.** RunProof produces *state-conformance evidence*, not cryptographic
proof of execution. It shows the chain did or did not end up where the spec said it would. It
does not prove KeeperHub's transaction was the *cause*: a third party writing to the same
contract mid-run could make a failed action look `verified`. On a dedicated fixture that nobody
else calls, that gap is theoretical — but it is a gap, and `silent-failure` does not depend on
it. A state that never moved cannot have been moved by someone else.

## Run it

From a clean checkout, in order:

```bash
git clone --recurse-submodules https://github.com/amantajatii/RunProof && cd RunProof
pnpm install
cp .env.example .env
```

Fill `.env` in this order — `FIXTURE_ADDRESS` comes last because deploying needs the other three:

1. `SEPOLIA_RPC_URL` — any Sepolia endpoint.
2. `DEPLOYER_PRIVATE_KEY` / `DEPLOYER_ADDRESS` — a throwaway key with a little Sepolia ETH. Not
   a KeeperHub wallet: KeeperHub does not export private keys, and does not need to.
3. `KEEPERHUB_API_KEY` — a `kh_` org key from the KeeperHub dashboard.

Then deploy your own fixture and paste the address into `.env` as `FIXTURE_ADDRESS`:

```bash
set -a; source .env; set +a          # forge reads flags, not .env
forge create contracts/Fixture.sol:Fixture \
  --rpc-url "$SEPOLIA_RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY" --broadcast
# → "Deployed to: 0x…"  that address is FIXTURE_ADDRESS
```

The KeeperHub wallet must be able to call it. `Fixture` has no owner check, so any caller works.

```bash
node --env-file=.env src/runner.js specs/*.json   # all three scenarios
pnpm test                                          # spec parser, verdicts, forge test —
                                                   # no API key and no chain, but forge
                                                   # fetches solc on a cold cache
```

Writes `evidence/run-<ts>-<outcome>.json` (full raw responses, account ids and caller IP
redacted) and a matching `.html`
(a static report, no server, no framework). The outcome tag is `ok`, `MISMATCH`, or `ERRORED`,
so a run that blew up never looks like a clean one on disk. Exit code 0 means every spec observed the
behaviour it declared — including specs that declare a failure.

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
- `recovery.expect` is `keeperhub | none`. Retries surface as more than one entry in
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
src/verdict.js reduce a KeeperHub response to a claim, map claim + state → verdict
src/runner.js  orchestrate one spec, write evidence
src/report.js  evidence JSON → static HTML
```

Scope: Sepolia, KeeperHub REST workflow execution, one contract read per spec. Not a general
proof-of-execution layer and not multi-provider — `makeClients` rejects any chain but Sepolia
rather than pretend otherwise.

Transport is REST throughout. The MCP OAuth session threw intermittent 401s during the gate;
the `kh_` org key never failed once.

## Research notes

- [`gate-findings.md`](gate-findings.md) — what the KeeperHub API actually does under stress
  (Indonesian). The planned gas-underrun scenario turned out to be unbuildable: `gasLimitMultiplier`
  is ignored because the relayer sets its own gas limit. The `failOnError` trap replaced it, and
  it is the stronger demo.
- [`TEARDOWN.md`](TEARDOWN.md) — friction ledger and the upstream fix ([KeeperHub/keeperhub#1975](https://github.com/KeeperHub/keeperhub/pull/1975)).

Neither claims retry behaviour: `recoveryOwner: keeperhub` was never once observed, so it is
not asserted anywhere.
