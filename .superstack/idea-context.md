---
phase: idea
completed_at: 2026-08-06T00:00:00+07:00
chosen_idea:
  slug: runproof
  name: RunProof — KeeperHub Execution Conformance Harness
  one_liner: Prove that a KeeperHub workflow matches its declared intent through preconditions, real execution, post-state assertions, recovery, and audit evidence.
  why_crypto: Onchain state, transaction receipts, gas use, and recovery behavior cannot be proven without executing against a blockchain.
  scores:
    founder_fit: 2
    mvp_speed: 2
    distribution_clarity: 2
    market_pull: 2
    revenue_path: 1
    total: 9
  mvp_checklist:
    - Accept one executable JSON spec format.
    - Create and validate one KeeperHub workflow.
    - Run preflight simulation and a Sepolia canary transaction.
    - Assert the expected post-state.
    - Trigger a controlled gas underrun and identify whether KeeperHub or RunProof performs recovery.
    - Prove a forced revert is stopped during simulation without broadcast.
    - Collect execution metadata, transaction hash, gas, timestamps, and logs from KeeperHub MCP or REST.
    - Read contract state before and after execution, then generate the state diff and assertion result in RunProof.
    - Use an RPC receipt only for independent verification or missing evidence fields.
  gtm: Start with KeeperHub hackathon builders who need credible execution evidence for judging.
validation:
  demand_signals:
    - KeeperHub hackathon judging explicitly weights reliability, retries, gas handling, and audit trails.
    - Tenderly launched MCP validation and supports transaction sending through Web3 Actions + Node, proving demand with partial product overlap.
  risks:
    - category: technical
      description: First-time KeeperHub onboarding and live action schemas may consume the first build day.
      severity: high
    - category: market
      description: Tenderly owns generic simulation and can send transactions, but does not document KeeperHub-style managed gas retry evidence.
      severity: medium
    - category: scope
      description: A generic simulator, universal migration parser, or multi-chain product cannot ship credibly in seven days.
      severity: high
    - category: distribution
      description: Demand beyond the hackathon has not been confirmed with KeeperHub builders.
      severity: medium
  go_no_go: go
  confidence: 0.74
  next_steps:
    - Record every KeeperHub onboarding friction on Day 1 for the UX bounty.
    - Verify four bounty hypotheses with recordings and docs links: Node.js 22/24, retry escalation, Executions API discoverability from Keeper Runs docs, and per-plugin chain support.
    - Run a Day-1 gas-underrun experiment before implementing the harness; compare execution-record counts and logs to classify how retry appears and who owns recovery.
    - After the first successful transaction, inspect get_execution; fall back to the Executions API wait/logs endpoints, then RPC receipt enrichment only if required.
    - Ask one non-blocking question in the KeeperHub Discord while onboarding.
    - Query list_action_schemas before locking the executable spec.
    - Omit Defender and Gelato compatibility work from the MVP.
    - Freeze build scope after Day 5; use the remaining time for the demo video, transaction link, writeup, submission, and buffer.
    - Kill the idea if it becomes a generic EVM simulator or KeeperHub already exposes an equivalent postcondition and recovery harness.
source_reports:
  - idea-shortlist-20260806.html
  - research-pack.json
---
