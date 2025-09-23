"use client";

import React, { useState } from "react";

// Helper to summarize SafeWalletData for preview
import Modal from "@/app/components/Modal";
import Link from "next/link";
import AppSection from "@/app/components/AppSection";
import AppCard from "@/app/components/AppCard";
import { useSafeWalletContext } from "../provider/SafeWalletProvider";
import { useChains, useSwitchChain } from "wagmi";
import { SafeWalletData } from "../utils/types";

export default function AccountsPage() {
  const wagmiChains = useChains();
  const { switchChain } = useSwitchChain();
  const { safeWalletData, setSafeWalletData } = useSafeWalletContext();
  const [showDeployed, setShowDeployed] = useState(true);

  // Group safes by safeAddress for accordion display using addressBook and undeployedSafes
  const getGroupedSafes = (type: "deployed" | "undeployed") => {
    const grouped: Record<
      string,
      Array<{ chainId: string; name: string }>
    > = {};
    const { addressBook, undeployedSafes } = safeWalletData.data;
    Object.entries(addressBook).forEach(([chainId, safesObj]) => {
      Object.entries(safesObj).forEach(([safeAddress, name]) => {
        const isUndeployed =
          undeployedSafes[chainId] && undeployedSafes[chainId][safeAddress];
        if (
          (type === "undeployed" && isUndeployed) ||
          (type === "deployed" && !isUndeployed)
        ) {
          if (!grouped[safeAddress]) grouped[safeAddress] = [];
          grouped[safeAddress].push({
            chainId,
            name: String(name),
          });
        }
      });
    });
    return grouped;
  };

  const groupedSafes = getGroupedSafes(
    showDeployed ? "deployed" : "undeployed",
  );

  // Export SafeWallet data as JSON file
  function handleExport() {
    // We use a Blob and a temporary anchor element to trigger a download.
    // This is more robust than using a data URL in a Link, especially for large files.
    // The download attribute sets the filename for the user.
    // After the download, we revoke the object URL to free memory.
    const dataStr = JSON.stringify(safeWalletData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "msig-wallet-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  // State for import modal and preview
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importPreview, setImportPreview] = useState<
    SafeWalletData | { error: string } | null
  >(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Import logic: open file picker, parse JSON, show modal
  function handleImportClick() {
    fileInputRef.current?.click();
  }
  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
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
    // Reset input value so selecting the same file again will trigger onChange
    e.target.value = "";
  }

  function getSafeWalletSummary(
    data: SafeWalletData | { error: string } | null,
  ): string {
    if (!data || typeof data !== "object" || "error" in data)
      return "No valid SafeWallet data.";
    let summary = "";
    try {
      // Added Safes
      const addedSafes = data.data?.addedSafes ?? {};
      const chainSafes: string[] = [];
      Object.entries(addedSafes).forEach(([chain, safesObj]) => {
        const count = Object.keys(safesObj).length;
        chainSafes.push(`${chain}: ${count} Safe${count !== 1 ? "s" : ""}`);
      });
      summary += `Added Safe Accounts on ${Object.keys(addedSafes).length} chains\n`;
      summary += chainSafes.join("\n") + "\n";
      // Address Book
      const addressBook = data.data?.addressBook ?? {};
      const chainContacts: string[] = [];
      Object.entries(addressBook).forEach(([chain, contactsObj]) => {
        const count = Object.keys(contactsObj).length;
        chainContacts.push(
          `${chain}: ${count} contact${count !== 1 ? "s" : ""}`,
        );
      });
      summary += `Address book for ${Object.keys(addressBook).length} chains\n`;
      summary += chainContacts.join("\n") + "\n";
      // Visited Safe Accounts history
      summary += `Visited Safe Accounts history\n`;
      // Not activated Safe Accounts
      const undeployedSafes = data.data?.undeployedSafes ?? {};
      let undeployedCount = 0;
      Object.values(undeployedSafes).forEach((safesObj) => {
        undeployedCount += Object.keys(safesObj).length;
      });
      summary += `Not activated Safe Accounts ${undeployedCount}`;
    } catch {
      summary = "Could not summarize SafeWallet data.";
    }
    return summary;
  }

  return (
    <AppSection className="mx-auto max-w-4xl">
      <AppCard>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold">Safe Accounts</h2>
          <div className="flex flex-col gap-2 md:flex-row">
            <Link href="/new-safe/create" className="btn btn-primary btn-sm">
              Create Safe
            </Link>
            <Link href="/new-safe/connect" className="btn btn-secondary btn-sm">
              Add Safe
            </Link>
          </div>
        </div>
        <div className="mb-4 flex justify-center">
          <div className="form-control">
            <label className="label cursor-pointer gap-2">
              <span className="label-text">Undeployed</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={showDeployed}
                onChange={() => setShowDeployed(!showDeployed)}
              />
              <span className="label-text">Deployed</span>
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {Object.keys(groupedSafes).length === 0 ? (
            <div className="text-center text-gray-400">No Safes found.</div>
          ) : (
            Object.entries(groupedSafes).map(([safeAddress, chains]) => {
              // Use the first chain's name for display, since all have the same name
              const displayName = chains[0]?.name || safeAddress;
              return (
                <div
                  className="bg-base-100 border-base-300 collapse-arrow collapse border"
                  key={safeAddress}
                >
                  <input type="checkbox" />
                  <div className="collapse-title flex items-center gap-2 font-semibold">
                    <span className="text-lg font-bold break-all">
                      {displayName}
                    </span>
                    <span className="font-mono text-xs break-all text-gray-500">
                      {safeAddress}
                    </span>
                  </div>
                  <div className="collapse-content">
                    <ul className="list bg-base-100 rounded-box gap-4 shadow-md">
                      {chains.map(({ chainId }) => (
                        <Link
                          className="list-row border-accent text-base-content hover:bg-base-200 flex w-full items-center gap-4 rounded border-2 p-4 font-bold"
                          href={`/safe/${safeAddress}`}
                          key={chainId}
                          onClick={() =>
                            switchChain({ chainId: parseInt(chainId) })
                          }
                        >
                          {wagmiChains.find((c) => c.id.toString() === chainId)
                            ?.name || chainId}
                          <span className="ml-2 text-xs text-gray-500">
                            ({chainId})
                          </span>
                        </Link>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </AppCard>
      {/* Import/Export buttons below the card */}
      <div className="mt-6 flex justify-center gap-2">
        <button
          className="btn btn-primary btn-outline btn-sm"
          onClick={handleExport}
        >
          Export Wallets
        </button>
        <button
          className="btn btn-secondary btn-outline btn-sm"
          onClick={handleImportClick}
        >
          Import Wallets
        </button>
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          accept=".json"
          onChange={handleImportFile}
        />
      </div>

      {/* Import Modal using generic Modal component */}
      <Modal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        boxClassName="modal-box w-full max-w-2xl flex flex-col gap-6 p-8"
        showCloseButton={false}
      >
        <h3 className="mb-4 text-lg font-bold">Import SafeWallet Data</h3>
        <>
          <div className="alert alert-warning mb-4 text-sm">
            <span>
              <strong>Warning:</strong> This will replace all your current
              SafeWallet data. This action cannot be undone.
            </span>
          </div>
          <div className="bg-base-200 mb-4 w-full rounded border p-4 shadow">
            <pre className="max-h-[40vh] overflow-y-auto font-mono text-xs break-words whitespace-pre-wrap">
              {getSafeWalletSummary(importPreview)}
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
              className="btn btn-error"
              disabled={
                typeof importPreview !== "object" ||
                importPreview === null ||
                "error" in importPreview
              }
              onClick={() => {
                if (
                  importPreview &&
                  typeof importPreview === "object" &&
                  !("error" in importPreview)
                ) {
                  setSafeWalletData(importPreview as SafeWalletData);
                  setShowImportModal(false);
                }
              }}
            >
              Replace
            </button>
          </div>
        </>
      </Modal>
    </AppSection>
  );
}
