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
import React, { createContext, useState, useCallback, useEffect } from "react";
import Safe, { SafeConfig } from "@safe-global/protocol-kit";
import { getMinimalEIP1193Provider, createSafeConfig } from "./helpers";
import { SafeDeployStep, SafeConnectStep } from "./types";
import { waitForTransactionReceipt } from "viem/actions";
import { useAccount } from "wagmi";
import { Chain, zeroAddress } from "viem";

// -- Interfaces and Context --
interface SafeContextType {
  currentProtcolKit: Safe | undefined;
  resetSafe: () => void;
  // Predict flow
  predictSafeAddress: (
    owners: `0x${string}`[],
    threshold: number,
    saltNonce?: string,
  ) => Promise<`0x${string}`>;
  isPredicting: boolean;
  predictError: string | null;
  // Deploy flow
  deploySafe: (
    chain: Chain,
    owners: `0x${string}`[],
    threshold: number,
    saltNonce?: string,
  ) => Promise<SafeDeployStep[]>;
  isDeploying: boolean;
  deployError: string | null;
  deployTxHash: string | null;
  deploySteps: SafeDeployStep[];
  // Connection flow
  connectSafe: (address: `0x${string}`) => Promise<void>;
  isConnecting: boolean;
  connectError: string | null;
  connectSteps: SafeConnectStep[];
}

export const SafeContext = createContext<SafeContextType | undefined>(
  undefined,
);

// -- Provider Component --
export const SafeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { address: signer, connector } = useAccount();

  // Current connected Safe in use by the user
  const [currentProtcolKit, setCurrentProtocolKit] = useState<Safe>();

  // State for predicting Safe
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);
  // State for deploying safe
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployTxHash, setDeployTxHash] = useState<string | null>(null);
  const [deploySteps, setDeploySteps] = useState<SafeDeployStep[]>([
    { step: "txCreated", status: "idle" },
    { step: "txSent", status: "idle" },
    { step: "confirmed", status: "idle" },
    { step: "deployed", status: "idle" },
  ]);
  // Connection flow state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSteps, setConnectSteps] = useState<SafeConnectStep[]>([
    { step: "pending", status: "idle" },
    { step: "connecting", status: "idle" },
    { step: "connected", status: "idle" },
  ]);

  // Sync currentProtcolKit address to localStorage for auto-connect
  useEffect(() => {
    if (currentProtcolKit) {
      currentProtcolKit.getAddress().then((address) => {
        localStorage.setItem("safeAddress", address);
      });
    }
  }, [currentProtcolKit]);

  function resetSafe() {
    setCurrentProtocolKit(undefined);
    setPredictError(null);
    setIsPredicting(false);
    setIsDeploying(false);
    setDeployError(null);
    setDeployTxHash(null);
    setIsConnecting(false);
  }

  /**
   * Predict Safe address for a single chain, but keep protocolKits for future multichain support
   */
  const predictSafeAddress = useCallback(
    async (owners: `0x${string}`[], threshold: number, saltNonce?: string) => {
      let kit: Safe | null = null;
      const provider = await getMinimalEIP1193Provider(connector);
      if (!provider) {
        setPredictError("Provider not available");
        setIsPredicting(false);
        return zeroAddress;
      }
      try {
        const config: SafeConfig = createSafeConfig(
          provider,
          signer,
          owners,
          threshold,
          saltNonce,
        );
        kit = await Safe.init(config);
      } catch (e: unknown) {
        setPredictError(
          e instanceof Error ? e.message : "Failed to predict Safe address",
        );
      } finally {
        setIsPredicting(false);
      }
      return kit?.getAddress() as Promise<`0x${string}`>;
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
    ) => {
      const steps: SafeDeployStep[] = [
        { step: "txCreated", status: "idle" },
        { step: "txSent", status: "idle" },
        { step: "confirmed", status: "idle" },
        { step: "deployed", status: "idle" },
      ];
      try {
        // Step 1: txCreated
        steps[0].status = "running";
        setDeploySteps([...steps]);
        const provider = await getMinimalEIP1193Provider(connector);
        if (!provider) {
          setDeployError("Provider not available");
          steps[0].status = "error";
          setDeploySteps([...steps]);
          setIsDeploying(false);
          return steps;
        }
        const config: SafeConfig = createSafeConfig(
          provider,
          signer,
          owners,
          threshold,
          saltNonce,
        );

        const kit = await Safe.init(config);
        let deploymentTx, kitClient, txHash;
        try {
          deploymentTx = await kit.createSafeDeploymentTransaction();
          kitClient = await kit.getSafeProvider().getExternalSigner();
          steps[0].status = "success";
          steps[1].status = "running";
          setDeploySteps([...steps]);
        } catch (e: unknown) {
          const errMsg =
            e instanceof Error
              ? e.message
              : "Failed to create deployment transaction";
          setDeployError(errMsg);
          steps[0].status = "error";
          setDeploySteps([...steps]);
          setIsDeploying(false);
          return steps;
        }
        try {
          txHash = await kitClient!.sendTransaction({
            to: deploymentTx.to as `0x${string}`,
            value: BigInt(deploymentTx.value),
            data: deploymentTx.data as `0x${string}`,
            chain: chain,
          });
          setDeployTxHash(txHash);
          steps[1].status = "success";
          steps[2].status = "running";
          setDeploySteps([...steps]);
        } catch (e: unknown) {
          const errMsg =
            e instanceof Error ? e.message : "Failed to send transaction";
          setDeployError(errMsg);
          steps[1].status = "error";
          setDeploySteps([...steps]);
          setIsDeploying(false);
          return steps;
        }
        try {
          if (txHash) {
            await waitForTransactionReceipt(kitClient!, { hash: txHash });
            setDeployTxHash(txHash);
            steps[2].status = "success";
            steps[3].status = "running";
            setDeploySteps([...steps]);
          }
        } catch (e: unknown) {
          const errMsg =
            e instanceof Error ? e.message : "Failed to confirm transaction";
          setDeployError(errMsg);
          steps[2].status = "error";
          setDeploySteps([...steps]);
          setIsDeploying(false);
          return steps;
        }
        try {
          const safeAddress = await kit.getAddress();
          const newKit = await kit.connect({ safeAddress });
          const isDeployed = await newKit.isSafeDeployed();
          if (!isDeployed) throw new Error("Safe deployment not detected");
          setDeployTxHash(txHash);
          steps[3].status = "success";
          setDeploySteps([...steps]);
          setCurrentProtocolKit(newKit);
        } catch (e: unknown) {
          const errMsg =
            e instanceof Error ? e.message : "Failed to verify Safe deployment";
          setDeployError(errMsg);
          steps[3].status = "error";
          setDeploySteps([...steps]);
          setIsDeploying(false);
          return steps;
        }
      } catch (e: unknown) {
        setDeployError(
          e instanceof Error ? e.message : "Failed to deploy Safe",
        );
        steps[0].status = "error";
        setDeploySteps([...steps]);
      } finally {
        // Do not setIsDeploying(false) here; let the client handle closing the modal.
      }
      return steps;
    },
    [signer, connector],
  );

  /**
   * Connect to an existing Safe by address and chain, check if deployed, and update state
   */
  const connectSafe = useCallback(
    async (safeAddress: `0x${string}`) => {
      const steps: SafeConnectStep[] = [
        { step: "pending", status: "idle" },
        { step: "connecting", status: "idle" },
        { step: "connected", status: "idle" },
      ];

      try {
        // Step 1: pending
        steps[0].status = "running";
        setConnectSteps([...steps]);
        if (!connector || !signer) {
          setConnectError("Wallet not connected");
          steps[0].status = "error";
          setConnectSteps([...steps]);
          setIsConnecting(false);
          return;
        }
        const provider = await getMinimalEIP1193Provider(connector);
        if (!provider) {
          setConnectError("Provider not available");
          steps[0].status = "error";
          setConnectSteps([...steps]);
          setIsConnecting(false);
          return;
        }
        const config: SafeConfig = {
          provider,
          signer,
          safeAddress,
        };
        const kit = await Safe.init(config);
        const connectedKit = await kit.connect({ safeAddress });
        setCurrentProtocolKit(connectedKit);
        // Step 2: connecting
        steps[0].status = "success";
        steps[1].status = "running";
        setConnectSteps([...steps]);
        const deployed = await connectedKit.isSafeDeployed();
        // Step 3: connected
        steps[1].status = "success";
        steps[2].status = deployed ? "success" : "error";
        setConnectSteps([...steps]);
        if (!deployed) {
          setConnectError(
            "This address is not a deployed Safe. Please check or create a new Safe.",
          );
        }
      } catch (e: unknown) {
        console.error("connectSafe error", e);
        setConnectError(
          e instanceof Error ? e.message : "Failed to connect to Safe",
        );
        steps[0].status = "error";
        setConnectSteps([...steps]);
      } finally {
        setIsConnecting(false);
      }
    },
    [connector, signer],
  );

  return (
    <SafeContext.Provider
      value={{
        currentProtcolKit,
        resetSafe,
        // Predict flow
        predictSafeAddress,
        isPredicting,
        predictError,
        // Deploy flow
        deploySafe,
        isDeploying,
        deployError,
        deployTxHash,
        deploySteps,
        // Connection flow
        connectSafe,
        isConnecting,
        connectError,
        connectSteps,
      }}
    >
      {children}
    </SafeContext.Provider>
  );
};
