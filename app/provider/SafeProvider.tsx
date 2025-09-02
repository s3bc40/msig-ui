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

export type SafeDeployStep = {
  status: "pending" | "txSent" | "confirmed" | "deployed" | "error";
  txHash?: string;
  error?: string;
};

export interface SafeContextType {
  protocolKits: Record<number, Safe | null>; // chainId -> ProtocolKit
  safeAddress: string | null; // Canonical Safe address
  isLoading: boolean;
  error: string | null;
  predictSafeAddress: (
    selectedChain: Chain[],
    owners: `0x${string}`[],
    threshold: number,
    saltNonce?: string,
  ) => Promise<`0x${string}`>;
  deploySafe: (
    selectedChain: Chain[],
    owners: `0x${string}`[],
    threshold: number,
    saltNonce?: string,
    onStatusUpdate?: (chainId: number, step: SafeDeployStep) => void,
  ) => Promise<Record<number, SafeDeployStep>>;
  resetSafe: () => void;
}

const SafeContext = createContext<SafeContextType | undefined>(undefined);

export const SafeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { address: signer } = useAccount();

  // Store ProtocolKit instances per chain
  const [protocolKits, setProtocolKits] = useState<Record<number, Safe | null>>(
    {},
  );
  const [safeAddress, setSafeAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
   * Predict Safe address for all selected chains, but store/display only one canonical address
   */
  const predictSafeAddress = useCallback(
    async (
      selectedChain: Chain[],
      owners: `0x${string}`[],
      threshold: number,
      saltNonce?: string,
    ) => {
      setIsLoading(true);
      setError(null);
      const kits: Record<number, Safe | null> = {};
      let canonicalAddress: string = "";
      try {
        for (const chain of selectedChain) {
          const config: SafeConfig = {
            provider: chain.rpcUrls.default.http[0],
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
          const kit = await Safe.init(config);
          kits[chain.id] = kit;
          const addr = await kit.getAddress();
          if (!canonicalAddress) canonicalAddress = addr;
        }
        setProtocolKits(kits);
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Failed to predict Safe address");
        }
      } finally {
        setIsLoading(false);
      }
      console.log("Predicted Safe address:", canonicalAddress);
      return canonicalAddress as `0x${string}`;
    },
    [signer],
  );

  /**
   * Deploy Safe on each selected chain
   */
  const deploySafe = useCallback(
    async (
      selectedChain: Chain[],
      owners: `0x${string}`[],
      threshold: number,
      saltNonce?: string,
      onStatusUpdate?: (chainId: number, step: SafeDeployStep) => void,
    ) => {
      setIsLoading(true);
      setError(null);
      const status: Record<number, SafeDeployStep> = {};
      try {
        for (const chain of selectedChain) {
          let kit = protocolKits[chain.id];
          if (!kit) {
            const config: SafeConfig = {
              provider: chain.rpcUrls.default.http[0],
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
          // 1. Pending
          console.log("Deploying Safe on chain:", chain.name);
          status[chain.id] = { status: "pending" };
          onStatusUpdate?.(chain.id, status[chain.id]);
          try {
            console.log("Creating deployment transaction...");
            // 2. Create deployment transaction
            // let deploymentTx;
            const deploymentTx = await kit.createSafeDeploymentTransaction();
            // 3. Get external signer
            const client = await kit.getSafeProvider().getExternalSigner();
            console.log("Sending deployment transaction...");
            // 4. Send transaction
            const txHash = await client!.sendTransaction({
              to: deploymentTx.to as `0x${string}`,
              value: BigInt(deploymentTx.value),
              data: deploymentTx.data as `0x${string}`,
              chain: chain,
            });
            console.log("Transaction sent with hash:", txHash);
            status[chain.id] = { status: "txSent", txHash };
            onStatusUpdate?.(chain.id, status[chain.id]);
            // 5. Wait for receipt
            console.log("Waiting for transaction confirmation...");
            if (txHash) {
              await waitForTransactionReceipt(client!, { hash: txHash });
              status[chain.id] = { status: "confirmed", txHash };
              onStatusUpdate?.(chain.id, status[chain.id]);
            }
            console.log(
              "Transaction confirmed. Connecting to deployed Safe...",
            );
            // 6. Connect to deployed Safe
            const safeAddress = await kit.getAddress();
            const newKit = await kit.connect({
              safeAddress,
            });
            // 7. Check deployment status
            console.log("Verifying Safe deployment...");
            await newKit.isSafeDeployed();
            // 8. Deployed
            status[chain.id] = { status: "deployed", txHash };
            onStatusUpdate?.(chain.id, status[chain.id]);
            // Update protocolKits with newKit
            console.log("Safe deployed at address:", safeAddress);
            protocolKits[chain.id] = newKit;
            setProtocolKits({ ...protocolKits });
          } catch (e: unknown) {
            status[chain.id] = {
              status: "error",
              error: e instanceof Error ? e.message : "Failed to deploy Safe",
            };
            onStatusUpdate?.(chain.id, status[chain.id]);
          }
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to deploy Safe");
      } finally {
        setIsLoading(false);
      }
      return status;
    },
    [protocolKits, signer],
  );

  const resetSafe = useCallback(() => {
    setProtocolKits({});
    setSafeAddress(null);
    setError(null);
    setIsLoading(false);
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
