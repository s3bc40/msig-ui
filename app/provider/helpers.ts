// Helper functions for SafeProvider
import { Connector } from "wagmi";
import { localContractNetworks } from "./localContractNetworks";
import { MinimalEIP1193Provider } from "./types";

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
