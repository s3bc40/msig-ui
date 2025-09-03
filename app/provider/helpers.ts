// Helper functions for SafeProvider
import { Connector } from "wagmi";
import { localContractNetworks } from "./localContractNetworks";
import { SafeDeployStep, MinimalEIP1193Provider } from "./types";

/**
 * Get a minimal EIP-1193 provider from a wagmi Connector.
 *
 * @param connector - wagmi Connector instance
 * @returns A minimal EIP-1193 provider or null if connector is undefined
 */
export async function getMinimalEIP1193Provider(
  connector: Connector | undefined,
): Promise<MinimalEIP1193Provider | null> {
  if (!connector) return null;
  const rawProvider = await connector.getProvider();
  const baseProvider = rawProvider as MinimalEIP1193Provider;
  return {
    request: baseProvider.request,
    on: baseProvider.on,
    removeListener: baseProvider.removeListener,
  };
}

/**
 * Create configuration object for Safe SDK and ProtocolKit.
 *
 * @param provider - EIP-1193 provider
 * @param signer - Signer address
 * @param owners - Array of owner addresses
 * @param threshold - Number of required confirmations
 * @param saltNonce - Optional salt nonce for address prediction
 * @returns Configuration object for Safe SDK and ProtocolKit
 */
export function createSafeConfig(
  provider: MinimalEIP1193Provider,
  signer: string | undefined,
  owners: `0x${string}`[],
  threshold: number,
  saltNonce?: string,
) {
  return {
    provider,
    signer,
    predictedSafe: {
      safeAccountConfig: { owners, threshold },
      safeDeploymentConfig: saltNonce ? { saltNonce } : undefined,
    },
    contractNetworks: localContractNetworks,
  };
}

/**
 * Update the status of a deployment step and invoke the status update callback.
 *
 * @param steps - Array of deployment steps
 * @param idx - Index of the step to update
 * @param status - New status for the step
 * @param onStatusUpdate - Optional callback to invoke after updating the step
 * @param error - Optional error message if the step failed
 * @param txHash - Optional transaction hash associated with the step
 */
export function updateStep(
  steps: SafeDeployStep[],
  idx: number,
  status: SafeDeployStep["status"],
  onStatusUpdate?: (steps: SafeDeployStep[]) => void,
  error?: string,
  txHash?: string,
) {
  steps[idx].status = status;
  if (error) steps[idx].error = error;
  if (txHash) steps[idx].txHash = txHash;
  onStatusUpdate?.([...steps]);
}
