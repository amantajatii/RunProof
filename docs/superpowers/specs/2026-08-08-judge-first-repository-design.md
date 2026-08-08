# Judge-First Repository Design

## Objective

Make RunProof immediately understandable and credible to hackathon judges through the repository itself. The repository must lead with working onchain evidence rather than marketing presentation.

## Audience

The primary reader is a hackathon judge reviewing many projects quickly. They need to understand, in order:

1. What failure RunProof catches.
2. Why ordinary execution logs are insufficient.
3. How RunProof verifies the outcome independently.
4. Where the working transaction and evidence can be inspected.
5. How to reproduce the result.

## Chosen Approach

Use `README.md` as the single documentation entry point and the generated evidence HTML as the product surface.

Do not build:

- A separate landing page.
- A documentation site.
- A frontend application or backend service.
- Marketing sections that do not help a judge verify the project.

## README Information Architecture

The README should follow this sequence:

### 1. Immediate claim

- Project name and one-sentence pitch.
- One concrete false-success example: KeeperHub reports success while the expected onchain state does not change.
- A direct link to the strongest evidence report and transaction.

### 2. Proof at a glance

- A compact screenshot or GIF of the evidence report.
- The three demonstrated verdicts: `verified`, `honest-failure`, and `silent-failure`.
- A short statement explaining that state is read independently over RunProof's RPC rather than through KeeperHub.

### 3. Verification flow

A compact diagram or text flow:

```text
declarative spec
  -> KeeperHub workflow execution
  -> KeeperHub execution claim
  -> independent RPC pre/post-state reads
  -> claim versus state comparison
  -> verdict plus JSON/HTML evidence
```

### 4. Reproduction

- Prerequisites and required environment variables.
- Installation command.
- One command to run the three scenarios.
- One command to run the test suite.
- Exact location and naming of generated evidence files.

### 5. Verdict semantics

Keep the existing four-cell verdict matrix. Explain that a declared failure scenario can pass the harness when the observed failure is honest and matches the specification.

### 6. Architecture and scope

- Brief responsibilities of `spec.js`, `keeperhub.js`, `chain.js`, `verdict.js`, `runner.js`, and `report.js`.
- Explicit MVP boundary: Sepolia fixture scenarios and KeeperHub REST workflow execution.
- No claims of universal proof-of-execution or broad multi-provider support.

### 7. Research and reliability findings

Link to the friction ledger and relevant upstream contribution without allowing them to interrupt the main demo narrative.

## Evidence Presentation

The evidence HTML remains the visible product demonstration. It must retain:

- Workflow and execution identifiers.
- KeeperHub's reported status and transaction hashes.
- Independently observed pre-state and post-state.
- Expected postcondition and assertion result.
- Verdict and declared expectation.
- A chronological execution timeline.

Evidence artifacts should remain inspectable after the run. The referenced KeeperHub workflow must not be automatically deleted because its dashboard record is part of the audit trail.

## Content Reuse

All README claims must come from existing executable specs, evidence artifacts, tests, or documented gate findings. Avoid creating a second narrative that can drift from the implementation.

The submission video should follow the same order as the README and evidence report so judges see one consistent story across every surface.

## Failure Handling

- If a public evidence link is unavailable, provide the committed screenshot and explain how to regenerate the report locally.
- If a transaction explorer link becomes unavailable, retain the transaction hash in evidence JSON.
- If a scenario errors, its `ERRORED` evidence filename must remain visibly distinct from successful or mismatched runs.
- Never replace a failed live run with mock output.

## Verification

Before submission:

1. Run the JavaScript and Solidity tests in the project's normal environment.
2. Run all three live scenarios and confirm their observed verdicts match their declarations.
3. Open the newest evidence HTML and verify every link and identifier.
4. Follow the README from a clean checkout far enough to confirm that commands and environment-variable names are accurate.
5. Check that no secret values or private keys appear in tracked files, screenshots, video, or evidence intended for publication.

## Acceptance Criteria

- A judge can explain RunProof's purpose after reading the first screen of the README.
- The strongest evidence and transaction are reachable without searching the repository.
- The independent verification boundary is explicit.
- Reproduction requires no undocumented command.
- README, evidence report, and video use the same terminology and verdict names.
- No landing page, docs site, frontend framework, or unrelated feature is introduced.

