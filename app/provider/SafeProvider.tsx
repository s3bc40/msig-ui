"user client";

/**
 * SafeProvider Context for Safe ProtocolKit SDK
 *
 * This context uses React's useCallback to memoize context functions (initSafe, connectSafe, resetSafe).
 * Memoization ensures that the context value remains stable between renders, preventing unnecessary re-renders
 * in consumers and optimizing performance, especially in large or deeply nested React apps.
 *
 * If you refactor this file, keep useCallback for context functions unless you have a specific reason to remove it.
 * For more details, see: https://react.dev/reference/react/useCallback
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import Safe, { SafeConfig } from "@safe-global/protocol-kit";
import { localContractNetworks } from "./localContractNetworks";
import { waitForTransactionReceipt } from "viem/actions";
import { useAccount } from "wagmi";
import { Chain } from "viem";

// --- Types ---
export type SafeDeployStep = {
  step: "txCreated" | "txSent" | "confirmed" | "deployed";
  status: "idle" | "running" | "success" | "error";
  txHash?: string;
  error?: string;
};

// Reduce 'any' usage: cast rawProvider once, use proper types in wrapper
type MinimalEIP1193Provider = {
  request: (args: unknown) => Promise<unknown>;
  on?: (...args: unknown[]) => void;
  removeListener?: (...args: unknown[]) => void;
};

export interface SafeContextType {
  protocolKits: Record<number, Safe | null>; // chainId -> ProtocolKit
  safeAddress: string | null;
  isLoading: boolean;
  error: string | null;
  predictSafeAddress: (
    chain: Chain,
    owners: `0x${string}`[],
    threshold: number,
    saltNonce?: string,
  ) => Promise<`0x${string}`>;
  deploySafe: (
    chain: Chain,
    owners: `0x${string}`[],
    threshold: number,
    saltNonce?: string,
    onStatusUpdate?: (steps: SafeDeployStep[]) => void,
  ) => Promise<SafeDeployStep[]>;
  deployError: string | null;
  deployTxHash: string | null;
  resetSafe: () => void;
}

const SafeContext = createContext<SafeContextType | undefined>(undefined);

export const SafeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { address: signer, connector } = useAccount();

  // Store ProtocolKit instances per chain
  const [protocolKits, setProtocolKits] = useState<Record<number, Safe | null>>(
    {},
  );
  const [safeAddress, setSafeAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployTxHash, setDeployTxHash] = useState<string | null>(null);

  // Persist safeAddress in localStorage
  useEffect(() => {
    if (safeAddress) {
      localStorage.setItem("safeAddress", safeAddress);
    } else {
      localStorage.removeItem("safeAddress");
    }
  }, [safeAddress]);

  // Restore safeAddress on load
  useEffect(() => {
    const stored = localStorage.getItem("safeAddress");
    if (stored) setSafeAddress(stored);
  }, []);

  /**
   * Predict Safe address for a single chain, but keep protocolKits for future multichain support
   */
  const predictSafeAddress = useCallback(
    async (
      chain: Chain,
      owners: `0x${string}`[],
      threshold: number,
      saltNonce?: string,
    ) => {
      setIsLoading(true);
      setError(null);
      let kit: Safe | null = null;
      let addr: string = "";
      const rawProvider = await connector?.getProvider();
      const baseProvider = rawProvider as MinimalEIP1193Provider;
      const provider: MinimalEIP1193Provider = {
        request: baseProvider.request,
        on: baseProvider.on,
        removeListener: baseProvider.removeListener,
      };
      try {
        const config: SafeConfig = {
          provider,
          signer,
          predictedSafe: {
            safeAccountConfig: {
              owners,
              threshold,
            },
            safeDeploymentConfig: saltNonce ? { saltNonce } : undefined,
          },
          contractNetworks: localContractNetworks,
        };
        console.log("Predicting Safe address with config:", config);
        kit = await Safe.init(config);
        addr = await kit.getAddress();
        setProtocolKits((prev) => ({ ...prev, [chain.id]: kit }));
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : "Failed to predict Safe address",
        );
      } finally {
        setIsLoading(false);
      }
      setSafeAddress(addr);
      return addr as `0x${string}`;
    },
    [signer, connector],
  );

  /**
   * Deploy Safe on a single chain, but keep protocolKits for future multichain support
   */
  const deploySafe = useCallback(
    async (
      chain: Chain,
      owners: `0x${string}`[],
      threshold: number,
      saltNonce?: string,
      onStatusUpdate?: (steps: SafeDeployStep[]) => void,
    ) => {
      setIsLoading(true);
      setError(null);
      setDeployError(null);
      setDeployTxHash(null);
      const steps: SafeDeployStep[] = [
        { step: "txCreated", status: "idle" },
        { step: "txSent", status: "idle" },
        { step: "confirmed", status: "idle" },
        { step: "deployed", status: "idle" },
      ];
      const rawProvider = await connector?.getProvider();
      const baseProvider = rawProvider as MinimalEIP1193Provider;
      const provider: MinimalEIP1193Provider = {
        request: baseProvider.request,
        on: baseProvider.on,
        removeListener: baseProvider.removeListener,
      };
      try {
        let kit = protocolKits[chain.id];
        if (!kit) {
          const config: SafeConfig = {
            provider,
            signer,
            predictedSafe: {
              safeAccountConfig: {
                owners,
                threshold,
              },
              safeDeploymentConfig: saltNonce ? { saltNonce } : undefined,
            },
            contractNetworks: localContractNetworks,
          };
          kit = await Safe.init(config);
        }
        // Step 1: txCreated
        steps[0].status = "running";
        onStatusUpdate?.([...steps]);
        let deploymentTx, kitClient, txHash;
        try {
          deploymentTx = await kit.createSafeDeploymentTransaction();
          kitClient = await kit.getSafeProvider().getExternalSigner();
          steps[0].status = "success";
          onStatusUpdate?.([...steps]);
        } catch (e: unknown) {
          const errMsg =
            e instanceof Error
              ? e.message
              : "Failed to create deployment transaction";
          steps[0].status = "error";
          steps[0].error = errMsg;
          setDeployError(errMsg);
          onStatusUpdate?.([...steps]);
          setIsLoading(false);
          return steps;
        }
        // Step 2: txSent
        steps[1].status = "running";
        onStatusUpdate?.([...steps]);
        try {
          txHash = await kitClient!.sendTransaction({
            to: deploymentTx.to as `0x${string}`,
            value: BigInt(deploymentTx.value),
            data: deploymentTx.data as `0x${string}`,
            chain: chain,
          });
          steps[1].status = "success";
          steps[1].txHash = txHash;
          setDeployTxHash(txHash);
          onStatusUpdate?.([...steps]);
        } catch (e: unknown) {
          const errMsg =
            e instanceof Error ? e.message : "Failed to send transaction";
          steps[1].status = "error";
          steps[1].error = errMsg;
          setDeployError(errMsg);
          onStatusUpdate?.([...steps]);
          setIsLoading(false);
          return steps;
        }
        // Step 3: confirmed
        steps[2].status = "running";
        onStatusUpdate?.([...steps]);
        try {
          if (txHash) {
            await waitForTransactionReceipt(kitClient!, { hash: txHash });
            steps[2].status = "success";
            steps[2].txHash = txHash;
            setDeployTxHash(txHash);
            onStatusUpdate?.([...steps]);
          }
        } catch (e: unknown) {
          const errMsg =
            e instanceof Error ? e.message : "Failed to confirm transaction";
          steps[2].status = "error";
          steps[2].error = errMsg;
          setDeployError(errMsg);
          onStatusUpdate?.([...steps]);
          setIsLoading(false);
          return steps;
        }
        // Step 4: deployed
        steps[3].status = "running";
        onStatusUpdate?.([...steps]);
        try {
          const safeAddress = await kit.getAddress();
          const newKit = await kit.connect({ safeAddress });
          await newKit.isSafeDeployed();
          steps[3].status = "success";
          steps[3].txHash = txHash;
          setDeployTxHash(txHash);
          onStatusUpdate?.([...steps]);
          setProtocolKits((prev) => ({ ...prev, [chain.id]: newKit }));
        } catch (e: unknown) {
          const errMsg =
            e instanceof Error ? e.message : "Failed to verify Safe deployment";
          steps[3].status = "error";
          steps[3].error = errMsg;
          setDeployError(errMsg);
          onStatusUpdate?.([...steps]);
          setIsLoading(false);
          return steps;
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to deploy Safe");
        steps[0].status = "error";
        steps[0].error =
          e instanceof Error ? e.message : "Failed to deploy Safe";
      } finally {
        setIsLoading(false);
      }
      return steps;
    },
    [protocolKits, signer, connector],
  );

  const resetSafe = useCallback(() => {
    setProtocolKits({});
    setSafeAddress(null);
    setError(null);
    setIsLoading(false);
    setDeployError(null);
    setDeployTxHash(null);
    localStorage.removeItem("safeAddress");
  }, []);

  return (
    <SafeContext.Provider
      value={{
        protocolKits,
        safeAddress,
        isLoading,
        error,
        predictSafeAddress,
        deploySafe,
        deployError,
        deployTxHash,
        resetSafe,
      }}
    >
      {children}
    </SafeContext.Provider>
  );
};

export function useSafe() {
  const ctx = useContext(SafeContext);
  if (!ctx) throw new Error("useSafe must be used within a SafeProvider");
  return ctx;
}
