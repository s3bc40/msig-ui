"use client";

import AppAddress from "@/app/components/AppAddress";
import AppCard from "@/app/components/AppCard";
import AppSection from "@/app/components/AppSection";
import useSafe from "@/app/hooks/useSafe";
import {
  DEFAULT_DEPLOY_STEPS,
  STEPS_DEPLOY_LABEL,
} from "@/app/utils/constants";
import React, { useEffect, useState, useRef } from "react";
import { useSafeTxContext } from "@/app/provider/SafeTxProvider";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { ImportTxPreview, SafeDeployStep } from "@/app/utils/types";
import { EthSafeTransaction } from "@safe-global/protocol-kit";
import Link from "next/link";
import DeploymentModal from "@/app/components/DeploymentModal";
import ImportSafeTxModal from "@/app/components/ImportSafeTxModal";

export default function SafeDashboardClient({
  safeAddress,
}: {
  safeAddress: `0x${string}`;
}) {
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
  const { exportTx, importTx } = useSafeTxContext();

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

  // Utility to handle Safe transaction import and state update
  async function handleImportTx(
    importPreview: ImportTxPreview | { error: string } | null,
  ) {
    if (
      typeof importPreview === "object" &&
      importPreview !== null &&
      !("error" in importPreview)
    ) {
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
    }
  }

  return (
    <AppSection>
      {/* Stat row for key Safe data */}
      <div className="stats stats-horizontal mb-6">
        <div className="stat" data-testid="safe-dashboard-threshold">
          <div className="stat-title">Threshold</div>
          <div className="stat-value">{safeInfo?.threshold ?? "-"}</div>
        </div>
        <div className="stat" data-testid="safe-dashboard-owners">
          <div className="stat-title">Owners</div>
          <div className="stat-value">{safeInfo?.owners?.length ?? "-"}</div>
        </div>
        <div className="stat" data-testid="safe-dashboard-nonce">
          <div className="stat-title">Nonce</div>
          <div className="stat-value">{safeInfo?.nonce ?? "-"}</div>
        </div>
        <div className="stat" data-testid="safe-dashboard-balance">
          <div className="stat-title">Balance</div>
          <div className="stat-value text-primary flex gap-1">
            <p>
              {safeInfo?.balance ? formatEther(safeInfo.balance) : "-"}{" "}
              {chain?.nativeCurrency.symbol ?? ""}
            </p>
          </div>
        </div>
      </div>
      <div className="divider" data-testid="safe-dashboard-divider">
        {safeName ? `${safeName}` : "Safe Details"}
      </div>
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 md:grid-rows-2">
        {/* Safe Info fills left column, spans two rows */}
        <AppCard
          title="Safe Info"
          className="md:col-start-1 md:row-span-2 md:row-start-1"
        >
          <div className="mb-2" data-testid="safe-dashboard-address-row">
            <span className="font-semibold">Address:</span>
            <AppAddress address={safeAddress} className="ml-2" />
          </div>
          <div className="mb-2" data-testid="safe-dashboard-owners-row">
            <span className="font-semibold">Owners:</span>
            <ul className="ml-6 list-disc">
              {safeInfo?.owners?.length ? (
                safeInfo.owners.map((owner) => (
                  <li key={owner} data-testid={`safe-dashboard-owner-${owner}`}>
                    <AppAddress address={owner} className="text-xs" />
                  </li>
                ))
              ) : (
                <li className="text-xs text-gray-400">No owners found</li>
              )}
            </ul>
          </div>
          <div className="mb-2" data-testid="safe-dashboard-version-row">
            <span className="font-semibold">Version:</span>
            <span className="ml-2">{safeInfo?.version ?? "-"}</span>
          </div>
        </AppCard>
        {/* Actions in top right cell */}
        <AppCard title="Actions" className="md:col-start-2 md:row-start-1">
          <div className="flex flex-col gap-2">
            {/* Transaction import/export buttons */}
            <div
              className="mb-2 flex gap-2"
              data-testid="safe-dashboard-actions-row"
            >
              <button
                className="btn btn-primary btn-outline btn-sm"
                data-testid="safe-dashboard-export-tx-btn"
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
                data-testid="safe-dashboard-import-tx-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Import transaction JSON from file"
              >
                Import Tx
              </button>
              <input
                type="file"
                data-testid="safe-dashboard-import-tx-input"
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
                    data-testid="safe-dashboard-go-to-builder-btn"
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
          <AppCard
            title="Current Transaction"
            testid="safe-dashboard-current-tx-card"
          >
            <Link
              className="btn btn-accent btn-outline flex w-full items-center gap-4 rounded"
              data-testid="safe-dashboard-current-tx-link"
              href={`/safe/${safeAddress}/tx/${currentTxHash}`}
              title="View transaction details"
            >
              <span
                className="font-semibold"
                data-testid="safe-dashboard-current-tx-hash-label"
              >
                Tx Hash:
              </span>
              <span
                className="max-w-[30%] truncate"
                title={currentTxHash}
                data-testid="safe-dashboard-current-tx-hash-value"
              >
                {currentTxHash}
              </span>
              <span
                className="font-semibold"
                data-testid="safe-dashboard-current-tx-sigs-label"
              >
                Signatures:
              </span>
              <span data-testid="safe-dashboard-current-tx-sigs-value">
                {currentTx.signatures?.size ?? 0}
              </span>
            </Link>
          </AppCard>
        )}
      </div>
      {/* Modal for deployment workflow */}
      <DeploymentModal
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
      {/* Import Modal with preview and confirmation */}
      <ImportSafeTxModal
        open={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportPreview(null);
        }}
        importPreview={importPreview}
        onReplace={async () => handleImportTx(importPreview)}
      />
    </AppSection>
  );
}
