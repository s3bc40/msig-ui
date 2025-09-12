"use client";

import { useCallback } from "react";
import Safe, { SafeConfig } from "@safe-global/protocol-kit";
import {
  getMinimalEIP1193Provider,
  createPredictionConfig,
  createConnectionConfig,
} from "../utils/helpers";
import {
  SafeDeployStep,
  SafeConnectStep,
  PendingSafeStatus,
  PayMethod,
} from "../utils/types";
import { waitForTransactionReceipt } from "viem/actions";
import { zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { useSafeWalletContext } from "../provider/SafeWalletProvider";

export default function useNewSafe() {
  // Wagmi hooks
  const { address: signer, connector, chain } = useAccount();

  // Get SafeWalletProvider context
  const { addSafe, safeWalletData } = useSafeWalletContext();

  const predictNewSafeAddress = useCallback(
    async (
      owners: `0x${string}`[],
      threshold: number,
      chainId: number,
      saltNonce: string,
    ): Promise<{ address: `0x${string}`; isDeployed: boolean }> => {
      let kit: Safe | null = null;
      const provider = await getMinimalEIP1193Provider(connector, chainId);
      if (!provider) {
        return { address: zeroAddress, isDeployed: false };
      }
      try {
        const config: SafeConfig = createPredictionConfig(
          provider,
          signer,
          chainId,
          owners,
          threshold,
          saltNonce,
        );
        kit = await Safe.init(config);
        if (kit) {
          const safeAddress = await kit.getAddress();
          const isDeployed = await kit.isSafeDeployed();
          return { address: safeAddress as `0x${string}`, isDeployed };
        }
      } catch {
        return { address: zeroAddress, isDeployed: false };
      }
      return { address: zeroAddress, isDeployed: false };
    },
    [connector, signer],
  );

  const deployNewSafe = useCallback(
    async (
      owners: `0x${string}`[],
      threshold: number,
      saltNonce?: string,
    ): Promise<SafeDeployStep[]> => {
      const steps: SafeDeployStep[] = [
        { step: "txCreated", status: "idle" },
        { step: "txSent", status: "idle" },
        { step: "confirmed", status: "idle" },
        { step: "deployed", status: "idle" },
      ];
      try {
        steps[0].status = "running";
        const provider = await getMinimalEIP1193Provider(connector, chain?.id);
        if (!provider) {
          steps[0].status = "error";
          steps[0].error = "No provider found";
          return steps;
        }
        const config: SafeConfig = createPredictionConfig(
          provider,
          signer,
          chain?.id ?? 0,
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
        } catch (err) {
          steps[0].status = "error";
          steps[0].error = err instanceof Error ? err.message : String(err);
          return steps;
        }
        try {
          txHash = await kitClient!.sendTransaction({
            to: deploymentTx.to as `0x${string}`,
            value: BigInt(deploymentTx.value),
            data: deploymentTx.data as `0x${string}`,
            chain: chain,
          });
          steps[1].status = "success";
          steps[1].txHash = txHash;
          steps[2].status = "running";
        } catch (err) {
          steps[1].status = "error";
          steps[1].error = err instanceof Error ? err.message : String(err);
          return steps;
        }
        try {
          if (txHash) {
            await waitForTransactionReceipt(kitClient!, { hash: txHash });
            steps[2].status = "success";
            steps[2].txHash = txHash;
            steps[3].status = "running";
          }
        } catch (err) {
          steps[2].status = "error";
          steps[2].error = err instanceof Error ? err.message : String(err);
          return steps;
        }
        try {
          const safeAddress = await kit.getAddress();
          const newKit = await kit.connect({ safeAddress });
          const isDeployed = await newKit.isSafeDeployed();
          if (!isDeployed) throw new Error("Safe deployment not detected");
          steps[3].status = "success";
          steps[3].txHash = txHash;
          // Add to addedSafes if deployed, else to undeployedSafes
          if (isDeployed) {
            addSafe(
              String(chain?.id ?? 0),
              safeAddress,
              {
                owners,
                threshold,
              },
              true,
            );
          } else {
            addSafe(
              String(chain?.id ?? 0),
              safeAddress,
              {
                props: {
                  factoryAddress: "",
                  masterCopy: "",
                  safeAccountConfig: {
                    owners,
                    threshold,
                  },
                  saltNonce: saltNonce || "",
                  safeVersion: "",
                },
                status: {
                  status: PendingSafeStatus.AWAITING_EXECUTION,
                  type: PayMethod.PayLater,
                },
              },
              true,
            );
          }
        } catch (err) {
          steps[3].status = "error";
          steps[3].error = err instanceof Error ? err.message : String(err);
          steps[3].txHash = txHash;
          return steps;
        }
      } catch (err) {
        steps[0].status = "error";
        steps[0].error = err instanceof Error ? err.message : String(err);
      }
      return steps;
    },
    [connector, signer, chain, addSafe],
  );

  const connectNewSafe = useCallback(
    async (
      safeAddress: `0x${string}`,
      chainId?: string | number,
    ): Promise<void> => {
      const steps: SafeConnectStep[] = [
        { step: "pending", status: "idle" },
        { step: "connecting", status: "idle" },
        { step: "connected", status: "idle" },
      ];
      try {
        steps[0].status = "running";
        if (!connector || !signer || !(chainId ?? chain?.id)) {
          steps[0].status = "error";
          return;
        }
        const resolvedChainId = chainId ?? chain?.id;
        const provider = await getMinimalEIP1193Provider(
          connector,
          Number(resolvedChainId),
        );
        if (!provider) {
          steps[0].status = "error";
          return;
        }
        const config = createConnectionConfig(
          provider,
          signer,
          Number(resolvedChainId),
          safeAddress,
        );
        // Initialize Safe SDK
        const kit = await Safe.init(config);
        const deployed = await kit.isSafeDeployed();
        if (!deployed) {
          steps[0].status = "error";
          return;
        }
        // Add to addedSafes if not present
        if (
          !safeWalletData.data.addedSafes[String(resolvedChainId)]?.[
            safeAddress
          ]
        ) {
          addSafe(
            String(resolvedChainId),
            safeAddress,
            {
              owners: [],
              threshold: 0,
            },
            true,
          );
        }
        steps[0].status = "success";
        steps[1].status = "running";
        steps[1].status = "success";
        steps[2].status = deployed ? "success" : "error";
      } catch {
        steps[0].status = "error";
      }
    },
    [connector, signer, chain, addSafe, safeWalletData],
  );

  return {
    predictNewSafeAddress,
    deployNewSafe,
    connectNewSafe,
  };
}
