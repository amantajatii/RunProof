import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as chains from 'viem/chains';

const chainById = (id) =>
  Object.values(chains).find((c) => c?.id === id) ??
  (() => {
    throw new Error(`chain ${id} is unknown to viem`);
  })();

/**
 * RunProof reads state itself, over its own RPC — never through KeeperHub.
 * That independence is the whole point: a reported success is only a claim.
 */
export function makeClients(chainId) {
  // Only Sepolia is wired up: there is one RPC env var. Reject anything else
  // rather than silently reading the wrong chain.
  if (chainId !== chains.sepolia.id)
    throw new Error(`only chainId ${chains.sepolia.id} (sepolia) is supported, spec asked for ${chainId}`);
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl) throw new Error('SEPOLIA_RPC_URL is not set');
  const chain = chainById(chainId);
  const transport = http(rpcUrl);

  const publicClient = createPublicClient({ chain, transport });

  // Setup/teardown are RunProof's own writes (deployer key), deliberately not
  // routed through KeeperHub so fixture arrangement can never mask its behaviour.
  const key = process.env.DEPLOYER_PRIVATE_KEY;
  const walletClient = key
    ? createWalletClient({ chain, transport, account: privateKeyToAccount(key) })
    : null;

  return { publicClient, walletClient };
}

export const readState = ({ publicClient }, spec) =>
  publicClient.readContract({
    address: spec.contract,
    abi: [spec.read],
    functionName: spec.read.name,
  });

/** Direct on-chain write for fixture arrangement. Returns the mined receipt. */
export async function directWrite(clients, spec, step) {
  if (!clients.walletClient)
    throw new Error('DEPLOYER_PRIVATE_KEY is not set, but the spec has a setup/teardown step');
  const hash = await clients.walletClient.writeContract({
    address: spec.contract,
    abi: [step.item],
    functionName: step.item.name,
    args: step.args,
  });
  return clients.publicClient.waitForTransactionReceipt({ hash });
}
