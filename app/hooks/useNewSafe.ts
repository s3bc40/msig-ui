"use client";

import { useCallback } from "react";
import Safe, { SafeConfig } from "@safe-global/protocol-kit";
import {
  getMinimalEIP1193Provider,
  createPredictionConfig,
  createConnectionConfig,
} from "../utils/helpers";
import { SafeDeployStep, SafeConnectStep } from "../utils/types";
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
      saltNonce?: string,
      chainId?: string | number,
    ): Promise<`0x${string}`> => {
      let kit: Safe | null = null;
      const resolvedChainId = chainId ?? chain?.id;
      const provider = await getMinimalEIP1193Provider(
        connector,
        Number(resolvedChainId),
      );
      if (!provider) {
        return zeroAddress;
      }
      try {
        const config: SafeConfig = createPredictionConfig(
          provider,
          signer,
          Number(resolvedChainId),
          owners,
          threshold,
          saltNonce,
        );
        kit = await Safe.init(config);
        // Optionally, add to undeployedSafes
        if (kit) {
          const safeAddress = await kit.getAddress();
          addSafe(
            String(resolvedChainId),
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
              status: { status: "predicted", type: "undeployed" },
            },
            false,
          );
          return safeAddress as `0x${string}`;
        }
      } catch {
        return zeroAddress;
      }
      return zeroAddress;
    },
    [connector, signer, chain, addSafe],
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
        } catch {
          steps[0].status = "error";
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
          steps[2].status = "running";
        } catch {
          steps[1].status = "error";
          return steps;
        }
        try {
          if (txHash) {
            await waitForTransactionReceipt(kitClient!, { hash: txHash });
            steps[2].status = "success";
            steps[3].status = "running";
          }
        } catch {
          steps[2].status = "error";
          return steps;
        }
        try {
          const safeAddress = await kit.getAddress();
          const newKit = await kit.connect({ safeAddress });
          const isDeployed = await newKit.isSafeDeployed();
          if (!isDeployed) throw new Error("Safe deployment not detected");
          steps[3].status = "success";
          // Add to addedSafes
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
              status: { status: "deployed", type: "deployed" },
            },
            true,
          );
        } catch {
          steps[3].status = "error";
          return steps;
        }
      } catch {
        steps[0].status = "error";
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
              props: {
                factoryAddress: "",
                masterCopy: "",
                safeAccountConfig: {
                  owners: [],
                  threshold: 0,
                },
                saltNonce: "",
                safeVersion: "",
              },
              status: { status: "connected", type: "deployed" },
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

  return { predictNewSafeAddress, deployNewSafe, connectNewSafe };
}
