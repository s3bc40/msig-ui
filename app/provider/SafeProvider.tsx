"use client";

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
import {
  getMinimalEIP1193Provider,
  createSafeConfig,
  updateStep,
} from "./helpers";
import { SafeDeployStep } from "./types";
import { waitForTransactionReceipt } from "viem/actions";
import { useAccount } from "wagmi";
import { Chain } from "viem";

// -- Interfaces and Context --
interface SafeContextType {
  protocolKits: Record<number, Safe | null>; // chainId -> ProtocolKit
  safeAddress: string | null;
  isPredicting: boolean;
  isDeploying: boolean;
  setIsDeploying: React.Dispatch<React.SetStateAction<boolean>>;
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
  // Connection flow
  connectSafe: (chain: Chain, address: `0x${string}`) => Promise<void>;
  isConnecting: boolean;
  connectError: string | null;
  isDeployed: boolean | null;
}

const SafeContext = createContext<SafeContextType | undefined>(undefined);

// -- Provider Component --
export const SafeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { address: signer, connector } = useAccount();

  // Store ProtocolKit instances per chain
  const [protocolKits, setProtocolKits] = useState<Record<number, Safe | null>>(
    {},
  );
  const [safeAddress, setSafeAddress] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployTxHash, setDeployTxHash] = useState<string | null>(null);
  // Connection flow state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isDeployed, setIsDeployed] = useState<boolean | null>(null);

  /**
   * Connect to an existing Safe by address and chain, check if deployed, and update state
   */
  const connectSafe = useCallback(
    async (chain: Chain, address: string) => {
      setIsConnecting(true);
      setConnectError(null);
      setIsDeployed(null);
      try {
        if (!connector || !signer) {
          setConnectError("Wallet not connected");
          setIsConnecting(false);
          return;
        }
        const provider = await getMinimalEIP1193Provider(connector);
        if (!provider) {
          setConnectError("Provider not available");
          setIsConnecting(false);
          return;
        }
        let kit = protocolKits[chain.id];
        let connectedKit;
        if (kit) {
          connectedKit = await kit.connect({ safeAddress: address });
        } else {
          const config: SafeConfig = {
            provider,
            signer,
            safeAddress: address,
          };
          kit = await Safe.init(config);
          connectedKit = await kit.connect({ safeAddress: address });
        }
        setProtocolKits((prev) => ({ ...prev, [chain.id]: connectedKit }));
        setSafeAddress(address);
        const deployed = await connectedKit.isSafeDeployed();
        setIsDeployed(deployed);
        if (!deployed) {
          setConnectError(
            "This address is not a deployed Safe. Please check or create a new Safe.",
          );
        }
      } catch (e: unknown) {
        setConnectError(
          e instanceof Error ? e.message : "Failed to connect to Safe",
        );
      } finally {
        setIsConnecting(false);
      }
    },
    [protocolKits, connector, signer],
  );

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
      setIsPredicting(true);
      setError(null);
      let kit: Safe | null = null;
      let addr: string = "";
      const provider = await getMinimalEIP1193Provider(connector);
      if (!provider) {
        setError("Provider not available");
        setIsPredicting(false);
        return "" as `0x${string}`;
      }
      try {
        const config: SafeConfig = createSafeConfig(
          provider,
          signer,
          owners,
          threshold,
          saltNonce,
        );
        console.log("Predicting Safe address with config:", config);
        kit = await Safe.init(config);
        addr = await kit.getAddress();
        setProtocolKits((prev) => ({ ...prev, [chain.id]: kit }));
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : "Failed to predict Safe address",
        );
      } finally {
        setIsPredicting(false);
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
      setIsDeploying(true);
      setError(null);
      setDeployError(null);
      setDeployTxHash(null);
      const steps: SafeDeployStep[] = [
        { step: "txCreated", status: "idle" },
        { step: "txSent", status: "idle" },
        { step: "confirmed", status: "idle" },
        { step: "deployed", status: "idle" },
      ];
      const provider = await getMinimalEIP1193Provider(connector);
      if (!provider) {
        setError("Provider not available");
        setIsDeploying(false);
        updateStep(steps, 0, "error", onStatusUpdate, "Provider not available");
        return steps;
      }
      try {
        let kit = protocolKits[chain.id];
        if (!kit) {
          const config: SafeConfig = createSafeConfig(
            provider,
            signer,
            owners,
            threshold,
            saltNonce,
          );
          kit = await Safe.init(config);
        }
        // Step 1: txCreated
        updateStep(steps, 0, "running", onStatusUpdate);
        let deploymentTx, kitClient, txHash;
        try {
          deploymentTx = await kit.createSafeDeploymentTransaction();
          kitClient = await kit.getSafeProvider().getExternalSigner();
          updateStep(steps, 0, "success", onStatusUpdate);
        } catch (e: unknown) {
          const errMsg =
            e instanceof Error
              ? e.message
              : "Failed to create deployment transaction";
          setDeployError(errMsg);
          setIsDeploying(false);
          updateStep(steps, 0, "error", onStatusUpdate, errMsg);
          return steps;
        }
        // Step 2: txSent
        updateStep(steps, 1, "running", onStatusUpdate);
        try {
          txHash = await kitClient!.sendTransaction({
            to: deploymentTx.to as `0x${string}`,
            value: BigInt(deploymentTx.value),
            data: deploymentTx.data as `0x${string}`,
            chain: chain,
          });
          setDeployTxHash(txHash);
          updateStep(steps, 1, "success", onStatusUpdate, undefined, txHash);
        } catch (e: unknown) {
          const errMsg =
            e instanceof Error ? e.message : "Failed to send transaction";
          setDeployError(errMsg);
          setIsDeploying(false);
          updateStep(steps, 1, "error", onStatusUpdate, errMsg);
          return steps;
        }
        // Step 3: confirmed
        updateStep(steps, 2, "running", onStatusUpdate);
        try {
          if (txHash) {
            await waitForTransactionReceipt(kitClient!, { hash: txHash });
            setDeployTxHash(txHash);
            updateStep(steps, 2, "success", onStatusUpdate, undefined, txHash);
          }
        } catch (e: unknown) {
          const errMsg =
            e instanceof Error ? e.message : "Failed to confirm transaction";
          setDeployError(errMsg);
          setIsDeploying(false);
          updateStep(steps, 2, "error", onStatusUpdate, errMsg);
          return steps;
        }
        // Step 4: deployed
        updateStep(steps, 3, "running", onStatusUpdate);
        try {
          const safeAddress = await kit.getAddress();
          const newKit = await kit.connect({ safeAddress });
          await newKit.isSafeDeployed();
          setDeployTxHash(txHash);
          updateStep(steps, 3, "success", onStatusUpdate, undefined, txHash);
          setProtocolKits((prev) => ({ ...prev, [chain.id]: newKit }));
        } catch (e: unknown) {
          const errMsg =
            e instanceof Error ? e.message : "Failed to verify Safe deployment";
          setDeployError(errMsg);
          setIsDeploying(false);
          updateStep(steps, 3, "error", onStatusUpdate, errMsg);
          return steps;
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to deploy Safe");
        updateStep(
          steps,
          0,
          "error",
          onStatusUpdate,
          e instanceof Error ? e.message : "Failed to deploy Safe",
        );
      } finally {
        // Do not setIsDeploying(false) here; let the client handle closing the modal.
      }
      return steps;
    },
    [protocolKits, signer, connector],
  );

  const resetSafe = useCallback(() => {
    setProtocolKits({});
    setSafeAddress(null);
    setError(null);
    setIsPredicting(false);
    setIsDeploying(false);
    setDeployError(null);
    setDeployTxHash(null);
    localStorage.removeItem("safeAddress");
  }, []);

  return (
    <SafeContext.Provider
      value={{
        protocolKits,
        safeAddress,
        isPredicting,
        isDeploying,
        setIsDeploying,
        error,
        predictSafeAddress,
        deploySafe,
        deployError,
        deployTxHash,
        resetSafe,
        // Connection flow
        connectSafe,
        isConnecting,
        connectError,
        isDeployed,
      }}
    >
      {children}
    </SafeContext.Provider>
  );
};

// -- Custom Hook --
export function useSafe() {
  const ctx = useContext(SafeContext);
  if (!ctx) throw new Error("useSafe must be used within a SafeProvider");
  return ctx;
}
