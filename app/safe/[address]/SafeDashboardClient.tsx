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
import React, { useEffect, useState, useRef } from "react";
import { useSafeKitContext } from "@/app/provider/SafeKitProvider";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { SafeDeployStep } from "@/app/utils/types";
import { EthSafeTransaction } from "@safe-global/protocol-kit";
import Link from "next/link";

export default function SafeDashboardClient({
  safeAddress,
}: {
  safeAddress: `0x${string}`;
}) {
  // Preview type for import
  type ImportTxPreview = EthSafeTransaction | { error: string } | null;
  // Try to get the name from addressBook for the current chain
  const { chain } = useAccount();
  const router = useRouter();
  const {
    safeName,
    safeInfo,
    isLoading,
    error,
    isOwner,
    readOnly,
    unavailable,
    kit,
    deployUndeployedSafe,
    getSafeTransactionCurrent,
  } = useSafe(safeAddress);
  const { exportTx, importTx } = useSafeKitContext();

  // Modal state for deployment
  const [modalOpen, setModalOpen] = useState(false);
  const [deploySteps, setDeploySteps] =
    useState<SafeDeployStep[]>(DEFAULT_DEPLOY_STEPS);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployTxHash, setDeployTxHash] = useState<string | null>(null);
  const [currentTx, setCurrentTx] = useState<EthSafeTransaction | null>(null);
  const [currentTxHash, setCurrentTxHash] = useState<string | null>(null);
  // Import/export modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<
    ImportTxPreview | { error: string } | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Fetch current transaction if any
  useEffect(() => {
    if (!kit || isLoading) return; // Wait for kit to be ready
    let cancelled = false;
    async function fetchTx() {
      try {
        const tx = await getSafeTransactionCurrent();
        const txHash = await kit?.getTransactionHash(tx as EthSafeTransaction);
        if (!cancelled) {
          setCurrentTx(tx);
          setCurrentTxHash(txHash || null);
        }
      } catch {
        if (!cancelled) {
          setCurrentTx(null);
          setCurrentTxHash(null);
        }
      }
    }
    fetchTx();
    return () => {
      cancelled = true;
    };
  }, [getSafeTransactionCurrent, kit, isLoading]);

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
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 md:grid-rows-2">
        {/* Safe Info fills left column, spans two rows */}
        <AppCard
          title="Safe Info"
          className="md:col-start-1 md:row-span-2 md:row-start-1"
        >
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
        {/* Actions in top right cell */}
        <AppCard title="Actions" className="md:col-start-2 md:row-start-1">
          <div className="flex flex-col gap-2">
            {/* Transaction import/export buttons */}
            <div className="mb-2 flex gap-2">
              <button
                className="btn btn-primary btn-outline btn-sm"
                onClick={() => {
                  if (!currentTx) return;
                  try {
                    const json = exportTx(safeAddress);
                    const blob = new Blob([json], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `safe-tx.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch {
                    // Optionally show error toast
                  }
                }}
                title="Export transaction JSON to file"
                disabled={!currentTx}
              >
                Export Tx
              </button>
              <button
                className="btn btn-secondary btn-outline btn-sm"
                onClick={() => fileInputRef.current?.click()}
                title="Import transaction JSON from file"
              >
                Import Tx
              </button>
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event: ProgressEvent<FileReader>) => {
                    try {
                      const result = event.target?.result;
                      if (typeof result === "string") {
                        const json = JSON.parse(result);
                        setImportPreview(json);
                      } else {
                        setImportPreview({ error: "Invalid file content." });
                      }
                      setShowImportModal(true);
                    } catch {
                      setImportPreview({ error: "Invalid JSON file." });
                      setShowImportModal(true);
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = "";
                }}
              />
            </div>
            {/* Import Modal with preview and confirmation */}
            {showImportModal && (
              <div className="bg-opacity-40 fixed inset-0 z-50 flex items-center justify-center bg-black">
                <div className="bg-base-100 w-full max-w-lg rounded p-6 shadow-lg">
                  <h2 className="mb-2 text-lg font-bold">
                    Import Transaction JSON
                  </h2>
                  <div className="alert alert-warning mb-4 text-sm">
                    <span>
                      <strong>Warning:</strong> This will replace your current
                      transaction for this Safe. This action cannot be undone.
                    </span>
                  </div>
                  <div className="bg-base-200 mb-4 w-full rounded border p-4 shadow">
                    <pre className="max-h-[40vh] overflow-y-auto font-mono text-xs break-words whitespace-pre-wrap">
                      {typeof importPreview === "object" &&
                      importPreview !== null
                        ? JSON.stringify(importPreview, null, 2)
                        : "No valid transaction data."}
                    </pre>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn btn-outline"
                      onClick={() => setShowImportModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={
                        typeof importPreview !== "object" ||
                        importPreview === null ||
                        "error" in importPreview
                      }
                      onClick={async () => {
                        try {
                          importTx(safeAddress, JSON.stringify(importPreview));
                          setShowImportModal(false);
                          setImportPreview(null);
                          // Optionally reload tx
                          const tx = await getSafeTransactionCurrent();
                          setCurrentTx(tx);
                          // Optionally update hash
                          if (kit && tx) {
                            const txHash = await kit.getTransactionHash(tx);
                            setCurrentTxHash(txHash || null);
                          }
                        } catch {
                          // Optionally show error toast
                        }
                      }}
                    >
                      Replace
                    </button>
                  </div>
                </div>
              </div>
            )}
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
        {/* Current Transaction in bottom right cell */}
        {currentTx && currentTxHash && (
          <AppCard title="Current Transaction">
            <Link
              className="btn btn-accent btn-outline flex w-full items-center gap-4 rounded"
              href={`/safe/${safeAddress}/tx/${currentTxHash}`}
              title="View transaction details"
            >
              <span className="font-semibold">Tx Hash:</span>
              <span className="max-w-[30%] truncate" title={currentTxHash}>
                {currentTxHash}
              </span>
              <span className="font-semibold">Signatures:</span>
              <span>{currentTx.signatures?.size ?? 0}</span>
            </Link>
          </AppCard>
        )}
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
