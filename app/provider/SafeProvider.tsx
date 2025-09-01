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
// import { Chain } from "viem";
import { Chain } from "viem";
import { waitForTransactionReceipt } from "viem/actions";

interface SafeContextType {
  protocolKits: Record<number, Safe | null>; // chainId -> ProtocolKit
  safeAddress: string | null; // Canonical Safe address
  isLoading: boolean;
  error: string | null;
  predictSafeAddress: (chains: Chain[], config: SafeConfig) => Promise<string>;
  deploySafe: (
    chains: Chain[],
    config: SafeConfig,
  ) => Promise<Record<number, string>>;
  resetSafe: () => void;
}

const SafeContext = createContext<SafeContextType | undefined>(undefined);

export const SafeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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
    async (chains: Chain[], config: SafeConfig) => {
      setIsLoading(true);
      setError(null);
      const kits: Record<number, Safe | null> = {};
      let canonicalAddress: string = "";
      try {
        for (const chain of chains) {
          const kit = await Safe.init({
            ...config,
            provider: chain.rpcUrls.default.http[0],
          });
          kits[chain.id] = kit;
          const addr = await kit.getAddress();
          if (!canonicalAddress) canonicalAddress = addr;
        }
        setProtocolKits(kits);
        setSafeAddress(canonicalAddress);
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Failed to predict Safe address");
        }
      } finally {
        setIsLoading(false);
      }
      return canonicalAddress;
    },
    [],
  );

  /**
   * Deploy Safe on each selected chain
   */
  const deploySafe = useCallback(
    async (chains: Chain[], config: SafeConfig) => {
      setIsLoading(true);
      setError(null);
      const txHashes: Record<number, string> = {};
      try {
        for (const chain of chains) {
          let kit = protocolKits[chain.id];
          if (!kit) {
            kit = await Safe.init({
              ...config,
              provider: chain.rpcUrls.default.http[0],
            });
          }
          // 1. Create deployment transaction
          const deploymentTx = await kit.createSafeDeploymentTransaction();
          // 2. Get external signer
          const client = await kit.getSafeProvider().getExternalSigner();
          // 3. Send transaction
          const txHash = await client!.sendTransaction({
            to: deploymentTx.to as `0x${string}`,
            value: BigInt(deploymentTx.value),
            data: deploymentTx.data as `0x${string}`,
            chain: chain,
          });
          txHashes[chain.id] = txHash || "";
          // 4. Wait for receipt
          if (txHash) {
            await waitForTransactionReceipt(client!, { hash: txHash });
          }
          // 5. Connect to deployed Safe
          const safeAddress = await kit.getAddress();
          const newKit = await kit.connect({
            safeAddress,
          });
          // Check deployment status
          await newKit.isSafeDeployed();
          // Update protocolKits with newKit
          protocolKits[chain.id] = newKit;
          setProtocolKits({ ...protocolKits });
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Failed to deploy Safe");
        }
      } finally {
        setIsLoading(false);
      }
      return txHashes;
    },
    [protocolKits],
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
