const BASE = process.env.KEEPERHUB_BASE_URL ?? 'https://app.keeperhub.com';

// REST only. MCP OAuth threw intermittent 401s during the gate (see TEARDOWN.md);
// the kh_ org key never failed once.
async function call(path, { method = 'GET', body } = {}) {
  const key = process.env.KEEPERHUB_API_KEY;
  if (!key) throw new Error('KEEPERHUB_API_KEY is not set');

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 400)}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${method} ${path} returned non-JSON: ${text.slice(0, 200)}`);
  }
}

/** Two-node workflow: manual trigger -> one web3/write-contract action. */
export const buildWorkflow = (spec) => ({
  name: `RunProof — ${spec.name}`,
  description: spec.description || `RunProof spec: ${spec.name}`,
  nodes: [
    {
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 0, y: 0 },
      data: { type: 'trigger', label: 'Trigger', config: { triggerType: 'Manual' }, status: 'idle' },
    },
    {
      id: 'step-1',
      type: 'action',
      position: { x: 252, y: 0 },
      data: {
        type: 'action',
        label: spec.name,
        status: 'idle',
        config: {
          actionType: 'web3/write-contract',
          network: String(spec.chainId),
          contractAddress: spec.contract,
          abi: JSON.stringify([spec.action.item]),
          abiFunction: spec.action.item.name,
          functionArgs: JSON.stringify(spec.action.args),
          failOnError: spec.action.failOnError,
        },
      },
    },
  ],
  edges: [{ id: 'e-trigger-1-step-1', source: 'trigger-1', target: 'step-1' }],
});

export const createWorkflow = (workflow) =>
  call('/api/workflows/create', { method: 'POST', body: workflow });

export const executeWorkflow = (workflowId) =>
  call(`/api/workflows/${workflowId}/execute`, { method: 'POST', body: {} });

export const waitForExecution = (executionId, timeoutMs = 60000) =>
  call(`/api/workflows/executions/${executionId}/wait?timeoutMs=${timeoutMs}`);

export const executionLogs = (executionId) =>
  call(`/api/workflows/executions/${executionId}/logs`);
