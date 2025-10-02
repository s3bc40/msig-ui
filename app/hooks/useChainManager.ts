import { useState } from "react";
import { createPublicClient, defineChain, http, Chain } from "viem";
import { CustomChainInput, DetectedChainResult } from "../utils/types";
import * as viemChains from "viem/chains";
import { useWagmiConfigContext } from "../provider/WagmiConfigProvider";

export function createChain(input: CustomChainInput) {
  return defineChain({
    id: input.id,
    name: input.name,
    nativeCurrency: input.nativeCurrency,
    rpcUrls: {
      default: {
        http: [input.rpcUrl],
      },
    },
    blockExplorers: input.blockExplorerUrl
      ? {
          default: {
            name: input.blockExplorerName || "Explorer",
            url: input.blockExplorerUrl,
          },
        }
      : undefined,
    contracts: input.contracts,
  });
}

export async function detectChainFromRpc(
  rpcUrl: string,
): Promise<DetectedChainResult> {
  const client = createPublicClient({ transport: http(rpcUrl) });
  const chainId = await client.getChainId();
  // Try to find a matching chain in viem/chains
  const found = Object.values(viemChains).find((chain) => chain.id === chainId);
  if (found) {
    return {
      chain: {
        ...found,
        rpcUrls: { default: { http: [rpcUrl] } },
      },
      isCustom: false,
    };
  } else {
    // Always return a valid Chain type
    const customChain: Chain = createChain({
      id: chainId,
      name: `Custom Chain ${chainId}`,
      nativeCurrency: { name: "Unknown", symbol: "UNKNOWN", decimals: 18 },
      rpcUrl: rpcUrl,
    });
    return {
      chain: customChain,
      isCustom: true,
    };
  }
}

export function useChainManager() {
  const { configChains, setConfigChains } = useWagmiConfigContext();
  const [error, setError] = useState<string | null>(null);
  const [detectedChain, setDetectedChain] =
    useState<DetectedChainResult | null>(null);
  const [detecting, setDetecting] = useState<boolean>(false);

  // Add or update a chain
  const addOrUpdateChain = (chain: Chain) => {
    setConfigChains((prev) => {
      const filtered = prev.filter((c) => c.id !== chain.id);
      return [...filtered, chain];
    });
  };

  // Remove a chain by id
  const removeChainById = (chainId: number) => {
    setConfigChains((prev) => prev.filter((c) => c.id !== chainId));
  };

  // Detect chain from RPC
  const detectChain = async (rpcUrl: string) => {
    setDetecting(true);
    setError(null);
    setDetectedChain(null);
    try {
      const result = await detectChainFromRpc(rpcUrl);
      setDetectedChain(result);
      setError(null);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message || "Failed to detect chain");
      } else {
        setError("Failed to detect chain");
      }
    } finally {
      setDetecting(false);
    }
  };

  return {
    configChains,
    addOrUpdateChain,
    removeChainById,
    detectChain,
    detectedChain,
    detecting,
    error,
  };
}
