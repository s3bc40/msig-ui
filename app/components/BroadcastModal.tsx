import React from "react";
import AppAddress from "@/app/components/AppAddress";

export interface BroadcastModalProps {
  open: boolean;
  txHash?: string | null;
  error?: string | null;
  blockExplorerUrl?: string;
  onClose: () => void;
  closeLabel?: string;
  onSuccess?: () => void;
  successLabel?: string;
}

const BroadcastModal: React.FC<BroadcastModalProps> = ({
  open,
  txHash,
  error,
  blockExplorerUrl,
  onClose,
  closeLabel = "Close",
  onSuccess,
  successLabel = "Back to Safe",
}) => {
  if (!open) return null;
  return (
    <dialog
      id="broadcast_modal"
      className="modal modal-bottom sm:modal-middle"
      open
    >
      <div className="modal-box flex !max-w-2xl flex-col gap-6 p-8">
        <div className="text-base-content font-bold">
          Broadcasting transaction
        </div>

        <div className="mb-4">
          {txHash && (
            <div className="mt-2">
              <span className="font-semibold">Transaction Hash:</span>
              {blockExplorerUrl ? (
                <a
                  href={`${blockExplorerUrl}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary ml-2"
                >
                  <AppAddress address={txHash} className="text-xs" />
                </a>
              ) : (
                <AppAddress address={txHash} className="ml-2 text-xs" />
              )}
            </div>
          )}
          {error && (
            <div className="alert alert-error mt-4 w-full max-w-full overflow-x-auto break-words">
              <pre className="text-xs whitespace-pre-wrap">{error}</pre>
            </div>
          )}
        </div>
        <div className="flex justify-center gap-4">
          {onSuccess && successLabel && !error ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onSuccess()}
            >
              {successLabel}
            </button>
          ) : (
            <button
              type="button"
              disabled={!error}
              className="btn btn-secondary"
              onClick={onClose}
            >
              {closeLabel}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
};

export { BroadcastModal };
