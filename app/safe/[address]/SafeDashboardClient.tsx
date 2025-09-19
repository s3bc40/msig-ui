"use client";

import AppAddress from "@/app/components/AppAddress";
import AppCard from "@/app/components/AppCard";
import AppSection from "@/app/components/AppSection";
import useSafe from "@/app/hooks/useSafe";
import { WorkflowModal } from "@/app/components/WorkflowModal";
import {
  DEFAULT_DEPLOY_STEPS,
  STEPS_DEPLOY_LABEL,
} from "@/app/utils/constants";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { SafeDeployStep } from "@/app/utils/types";

export default function SafeDashboardClient({
  safeAddress,
}: {
  safeAddress: `0x${string}`;
}) {
  // Try to get the name from addressBook for the current chain
  const { chain } = useAccount();
  const {
    safeName,
    safeInfo,
    isLoading,
    error,
    isOwner,
    readOnly,
    unavailable,
    deployUndeployedSafe,
    getTransaction,
    getSignatures,
  } = useSafe(safeAddress);
  const router = useRouter();

  // Modal state for deployment
  const [modalOpen, setModalOpen] = useState(false);
  const [deploySteps, setDeploySteps] =
    useState<SafeDeployStep[]>(DEFAULT_DEPLOY_STEPS);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployTxHash, setDeployTxHash] = useState<string | null>(null);

  // Handler for deploying undeployed Safe
  async function handleDeployUndeployedSafe() {
    setModalOpen(true);
    setDeployError(null);
    // Deep copy to reset steps
    setDeploySteps(DEFAULT_DEPLOY_STEPS.map((step) => ({ ...step })));
    setDeployTxHash(null);
    try {
      const steps = await deployUndeployedSafe(setDeploySteps);
      setDeploySteps([...steps]);
      // Set txHash from any step that has it
      const txStep = steps.find((s) => s.txHash);
      if (txStep && txStep.txHash) {
        setDeployTxHash(txStep.txHash);
      }
      // If any step failed, set error and keep modal open
      if (steps.some((s) => s.status === "error")) {
        const errorStep = steps.find((s) => s.status === "error");
        setDeployError(
          errorStep && errorStep.error
            ? `Deployment error: ${errorStep.error}`
            : "Deployment error",
        );
        return;
      }
    } catch {
      setDeployError("Unexpected deployment error");
    }
  }

  function handleCloseModal() {
    setModalOpen(false);
    // Deep copy to reset steps
    setDeploySteps(DEFAULT_DEPLOY_STEPS.map((step) => ({ ...step })));
  }

  function isDeploySuccess(
    deploySteps: SafeDeployStep[],
    deployTxHash: string | null,
  ) {
    return (
      deploySteps.length > 0 &&
      deploySteps.every((s) => s.status === "success") &&
      !!deployTxHash
    );
  }

  // Handler to go to builder page
  function handleGoToBuilder() {
    router.push(`/safe/${safeAddress}/new-tx`);
  }

  // Example: List recent transactions (from context/localStorage)
  // Replace with actual logic to list all tx hashes for this Safe
  // For demo, just show one recent tx if available
  const recentTxHash = null; // TODO: Replace with logic to get latest tx hash for this Safe

  return (
    <AppSection>
      {/* Stat row for key Safe data */}
      <div className="stats stats-horizontal mb-6">
        <div className="stat">
          <div className="stat-title">Threshold</div>
          <div className="stat-value">{safeInfo?.threshold ?? "-"}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Owners</div>
          <div className="stat-value">{safeInfo?.owners?.length ?? "-"}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Nonce</div>
          <div className="stat-value">{safeInfo?.nonce ?? "-"}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Balance</div>
          <div className="stat-value text-primary flex gap-1">
            <p>
              {safeInfo?.balance ? formatEther(safeInfo.balance) : "-"}{" "}
              {chain?.nativeCurrency.symbol ?? ""}
            </p>
          </div>
        </div>
      </div>
      <div className="divider">{safeName ? `${safeName}` : "Safe Details"}</div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AppCard title="Safe Info">
          <div className="mb-2">
            <span className="font-semibold">Address:</span>
            <AppAddress address={safeAddress} className="ml-2" />
          </div>
          <div className="mb-2">
            <span className="font-semibold">Owners:</span>
            <ul className="ml-6 list-disc">
              {safeInfo?.owners?.length ? (
                safeInfo.owners.map((owner) => (
                  <li key={owner}>
                    <AppAddress address={owner} className="text-xs" />
                  </li>
                ))
              ) : (
                <li className="text-xs text-gray-400">No owners found</li>
              )}
            </ul>
          </div>
          <div className="mb-2">
            <span className="font-semibold">Version:</span>
            <span className="ml-2">{safeInfo?.version ?? "-"}</span>
          </div>
        </AppCard>
        <AppCard title="Actions">
          <div className="flex flex-col gap-2">
            {/* Status and actions logic */}
            {isLoading && (
              <div className="flex h-20 items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            )}
            {error && <div className="alert alert-error">{error}</div>}
            {unavailable && (
              <div className="alert alert-warning mb-4">
                This Safe is not available on the selected network.
              </div>
            )}
            {safeInfo && !safeInfo.deployed && !unavailable && (
              <>
                <div className="alert alert-warning mb-4">
                  This Safe is not deployed yet. You can deploy it now to start
                  using multi-signature features.
                </div>
                {isOwner ? (
                  <button
                    className="btn btn-primary w-full"
                    onClick={handleDeployUndeployedSafe}
                  >
                    Deploy Safe
                  </button>
                ) : (
                  <div className="alert alert-info">
                    Read-only: Only owners can deploy.
                  </div>
                )}
              </>
            )}
            {safeInfo &&
              safeInfo.deployed &&
              !readOnly &&
              !isLoading &&
              !error &&
              !unavailable && (
                <>
                  <button
                    className="btn btn-outline btn-primary"
                    onClick={handleGoToBuilder}
                  >
                    Go to Builder
                  </button>
                  {recentTxHash && (
                    <>
                      <button
                        className="btn btn-outline btn-secondary"
                        onClick={() =>
                          router.push(`/safe/${safeAddress}/tx/${recentTxHash}`)
                        }
                      >
                        Sign Transaction
                      </button>
                      <button
                        className="btn btn-outline btn-success"
                        onClick={() =>
                          router.push(`/safe/${safeAddress}/tx/${recentTxHash}`)
                        }
                      >
                        Broadcast Transaction
                      </button>
                    </>
                  )}
                </>
              )}
            {safeInfo &&
              safeInfo.deployed &&
              readOnly &&
              !isLoading &&
              !error &&
              !unavailable && (
                <div className="alert alert-info">
                  Read-only: Only owners can perform actions.
                </div>
              )}
            {/* If no safeInfo, show a message */}
            {!safeInfo && !isLoading && !error && !unavailable && (
              <div className="alert alert-info">
                No Safe information available.
              </div>
            )}
          </div>
        </AppCard>
      </div>
      {/* Modal for deployment workflow */}
      <WorkflowModal
        open={modalOpen}
        steps={deploySteps}
        stepLabels={STEPS_DEPLOY_LABEL}
        txHash={deployTxHash}
        error={deployError}
        selectedNetwork={chain}
        onClose={handleCloseModal}
        closeLabel="Close"
        successLabel={
          isDeploySuccess(deploySteps, deployTxHash) ? "Go to Safe" : undefined
        }
        onSuccess={
          isDeploySuccess(deploySteps, deployTxHash)
            ? handleCloseModal
            : undefined
        }
      />
    </AppSection>
  );
}
