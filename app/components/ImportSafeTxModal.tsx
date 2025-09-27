import React from "react";
import Modal from "./Modal";
import { ImportTxPreview } from "../utils/types";

export interface ImportSafeTxModalProps {
  open: boolean;
  onClose: () => void;
  importPreview: ImportTxPreview | { error: string } | null;
  onReplace: () => void;
}

function getSafeTxSummary(
  data: ImportTxPreview | { error: string } | null,
): string {
  if (!data || typeof data !== "object" || "error" in data)
    return "No valid transaction data.";
  let summary = "";
  try {
    summary += `Transaction Preview\n`;
    summary += JSON.stringify(data, null, 2);
  } catch {
    summary = "Could not summarize transaction data.";
  }
  return summary;
}

export default function ImportSafeTxModal({
  open,
  onClose,
  importPreview,
  onReplace,
}: ImportSafeTxModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      boxClassName="modal-box w-full max-w-lg flex flex-col gap-6 p-6"
      showCloseButton={false}
      testid="safe-dashboard-import-tx-modal-root"
    >
      <h2
        className="mb-2 text-lg font-bold"
        data-testid="safe-dashboard-import-tx-modal-title"
      >
        Import Transaction JSON
      </h2>
      <div
        className="alert alert-warning mb-4 text-sm"
        data-testid="safe-dashboard-import-tx-modal-warning"
      >
        <span>
          <strong>Warning:</strong> This will replace your current transaction
          for this Safe. This action cannot be undone.
        </span>
      </div>
      <div
        className="bg-base-200 mb-4 w-full rounded border p-4 shadow"
        data-testid="safe-dashboard-import-tx-modal-preview"
      >
        <pre className="max-h-[40vh] overflow-y-auto font-mono text-xs break-words whitespace-pre-wrap">
          {getSafeTxSummary(importPreview)}
        </pre>
      </div>
      <div
        className="flex justify-end gap-2"
        data-testid="safe-dashboard-import-tx-modal-actions"
      >
        <button
          className="btn btn-outline"
          data-testid="safe-dashboard-import-tx-modal-cancel-btn"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          data-testid="safe-dashboard-import-tx-modal-replace-btn"
          disabled={
            typeof importPreview !== "object" ||
            importPreview === null ||
            "error" in importPreview
          }
          onClick={onReplace}
        >
          Replace
        </button>
      </div>
    </Modal>
  );
}
