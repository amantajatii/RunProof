/**
 * What KeeperHub claims happened, taken at face value from the execution record.
 * `output.success: true` alongside a set `error` is exactly the trap the gate found.
 */
export const readClaim = (wait) => ({
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
const TERMINAL = ['success', 'error'];

export function verdictOf(claim, assertionPass) {
  // /wait can return while the execution is still running — it takes a timeout, not
  // a guarantee. Reading a verdict off a pending execution would call a slow success
  // an honest-failure, which is exactly the kind of confident wrong answer RunProof
  // exists to prevent. No verdict is the correct answer here.
  if (!TERMINAL.includes(claim.status))
    throw new Error(`execution is not terminal (status=${claim.status}); no verdict can be read yet`);

  const claimed = claim.status === 'success' && claim.outputSuccess !== false;
  if (claimed) return assertionPass ? 'verified' : 'silent-failure';
  return assertionPass ? 'unreported-success' : 'honest-failure';
}

/**
 * Who recovered, judged only by what is visible in the evidence.
 *
 * `runproof` is deliberately not produced here. RunProof does not retry: the gate
 * found KeeperHub fails closed in simulation, so a failed action never reaches the
 * chain and there is nothing to recover from. Adding a retry would invent a recovery
 * story the evidence does not support. If a broadcast-then-fail path ever shows up,
 * that is when this earns a third branch.
 */
export const recoveryOwnerOf = (claim) =>
  claim.transactionHashes.length > 1 ? 'keeperhub' : 'none';
