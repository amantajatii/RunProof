# Graph Report - .  (2026-08-07)

## Corpus Check
- Corpus is ~6,310 words - fits in a single context window. You may not need a graph.

## Summary
- 55 nodes · 56 edges · 11 communities (9 shown, 2 thin omitted)
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Execution Evidence Risks
- Gas Recovery Ownership
- KeeperHub Product Context
- RunProof MVP Scope
- Hackathon Reliability Proof
- Authentication Surfaces
- Execution Lifecycle Provenance
- Runner Evidence Outputs
- Build Constraints
- Position Rescue Agent
- Runbook Drill Agent

## God Nodes (most connected - your core abstractions)
1. `KeeperHub` - 7 edges
2. `RunProof — KeeperHub Execution Conformance Harness` - 6 edges
3. `KeeperHub Onboarding Friction Ledger` - 5 edges
4. `RunProof Build Plan` - 5 edges
5. `RunProof` - 5 edges
6. `Relayer-Sponsored EIP-7702 Execution` - 4 edges
7. `Recovery Owner Attribution` - 4 edges
8. `RunProof Runner Flow` - 4 edges
9. `MCP OAuth Execute Workflow 401` - 3 edges
10. `Dual Authentication Surfaces` - 3 edges

## Surprising Connections (you probably didn't know these)
- `RunProof` --semantically_similar_to--> `RunProof — KeeperHub Execution Conformance Harness`  [INFERRED] [semantically similar]
  idea-shortlist-20260806.html → .superstack/idea-context.md
- `Gas Underrun Recovery Gate` --semantically_similar_to--> `Recovery Attribution Gate`  [INFERRED] [semantically similar]
  build-plan-20260807.md → idea-shortlist-20260806.html
- `RunProof Build Plan` --references--> `RunProof — KeeperHub Execution Conformance Harness`  [INFERRED]
  build-plan-20260807.md → .superstack/idea-context.md
- `Best Onboarding UX Improvement Bounty` --conceptually_related_to--> `KeeperHub Onboarding Friction Ledger`  [INFERRED]
  hackathon.md → TEARDOWN.md
- `Static Evidence Report` --conceptually_related_to--> `Execution Evidence Provenance`  [INFERRED]
  build-plan-20260807.md → idea-shortlist-20260806.html

## Hyperedges (group relationships)
- **RunProof Conformance Flow** — build_plan_20260807_executable_json_spec, build_plan_20260807_runner_flow, build_plan_20260807_state_diff, build_plan_20260807_static_evidence_report [EXTRACTED 1.00]
- **Gas Underrun Recovery Outcomes** — build_plan_20260807_keeperhub_recovery, build_plan_20260807_runproof_recovery, build_plan_20260807_fail_closed_preflight [EXTRACTED 1.00]
- **KeeperHub Execution and Reliability Surfaces** — hackathon_mcp_cli, hackathon_x402_mpp, hackathon_smart_gas_estimation, hackathon_private_routing, hackathon_audit_trail [EXTRACTED 1.00]

## Communities (11 total, 2 thin omitted)

### Community 0 - "Execution Evidence Risks"
Cohesion: 0.29
Nodes (7): Evidence Shape Experiment, Best Onboarding UX Improvement Bounty, Relayer-Sponsored EIP-7702 Execution, Evidence Payload Label Defects, KeeperHub Onboarding Friction Ledger, Receipt Actor Attribution Mismatch, Sponsored Gas Accounting

### Community 1 - "Gas Recovery Ownership"
Cohesion: 0.29
Nodes (7): Fail-Closed Preflight Recovery, Gas Underrun Recovery Gate, KeeperHub-Owned Recovery, Recovery Owner Attribution, RunProof-Owned Recovery, KeeperHub Gas Management, Recovery Attribution Gate

### Community 2 - "KeeperHub Product Context"
Cohesion: 0.29
Nodes (7): KeeperHub Agents Onchain Hackathon, KeeperHub, Last-Mile Onchain Execution Layer, KeeperHub MCP Server and CLI, Private Transaction Routing, Smart Gas Estimation, x402 and MPP Agentic Payments

### Community 3 - "RunProof MVP Scope"
Cohesion: 0.33
Nodes (6): Day-One Evidence and Recovery Gates, Executable Execution Conformance, RunProof MVP Scope, RunProof — KeeperHub Execution Conformance Harness, RunProof Scope Kill Criteria, Tenderly Partial Product Overlap

### Community 4 - "Hackathon Reliability Proof"
Cohesion: 0.33
Nodes (6): Hackathon Reliability Evidence Demand, Sepolia Counter Fixture Contract, KeeperHub Audit Trail, Hackathon Judging Criteria, Reliability Evidence Guidance, Testnet Submission Policy

### Community 5 - "Authentication Surfaces"
Cohesion: 0.33
Nodes (6): Dual Authentication Surfaces, KeeperHub MCP Agent Surface, KeeperHub REST Harness Surface, REST-Only Runner Transport, MCP OAuth Execute Workflow 401, REST Execution with Organization Key

### Community 6 - "Execution Lifecycle Provenance"
Cohesion: 0.33
Nodes (6): Execution Evidence Provenance, Intent-to-Recovery Conformance Lifecycle, KeeperHub Executions API, RunProof, RunProof Scope Boundary, Tenderly

### Community 7 - "Runner Evidence Outputs"
Cohesion: 0.67
Nodes (4): Executable JSON Spec, RunProof Runner Flow, RunProof Onchain State Diff, Static Evidence Report

### Community 8 - "Build Constraints"
Cohesion: 0.50
Nodes (4): Onboarding Friction Hypotheses, RunProof Build Plan, Secret Redaction Boundary, Node.js 22 versus 24 Conflict

## Knowledge Gaps
- **19 isolated node(s):** `Tenderly Partial Product Overlap`, `Receipt Actor Attribution Mismatch`, `Sponsored Gas Accounting`, `REST Execution with Organization Key`, `Evidence Payload Label Defects` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RunProof — KeeperHub Execution Conformance Harness` connect `RunProof MVP Scope` to `Build Constraints`, `Hackathon Reliability Proof`, `Execution Lifecycle Provenance`?**
  _High betweenness centrality (0.573) - this node is a cross-community bridge._
- **Why does `RunProof` connect `Execution Lifecycle Provenance` to `Gas Recovery Ownership`, `RunProof MVP Scope`?**
  _High betweenness centrality (0.412) - this node is a cross-community bridge._
- **Why does `RunProof Build Plan` connect `Build Constraints` to `RunProof MVP Scope`, `Hackathon Reliability Proof`, `Authentication Surfaces`?**
  _High betweenness centrality (0.376) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `RunProof — KeeperHub Execution Conformance Harness` (e.g. with `RunProof Build Plan` and `RunProof`) actually correct?**
  _`RunProof — KeeperHub Execution Conformance Harness` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Tenderly Partial Product Overlap`, `Receipt Actor Attribution Mismatch`, `Sponsored Gas Accounting` to the rest of the system?**
  _19 weakly-connected nodes found - possible documentation gaps or missing edges._