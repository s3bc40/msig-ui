import React from "react";
import AppAddress from "@/app/components/AppAddress";
import { Chain } from "viem";

export interface WorkflowModalProps {
  open: boolean;
  steps: Array<{ step: string; status: string }>;
  stepLabels: Record<string, string>;
  txHash?: string | null;
  error?: string | null;
  selectedNetwork?: Chain;
  onClose: () => void;
  onGoToSafe?: () => void;
  showGoToSafe?: boolean;
  goToSafeLabel?: string;
  closeLabel?: string;
}

const WorkflowModal: React.FC<WorkflowModalProps> = ({
  open,
  steps,
  stepLabels,
  txHash,
  error,
  selectedNetwork,
  onClose,
  onGoToSafe,
  showGoToSafe = false,
  goToSafeLabel = "Go to Safe",
  closeLabel = "Close",
}) => {
  if (!open) return null;
  return (
    <dialog
      id="workflow_modal"
      className="modal modal-bottom sm:modal-middle"
      open
    >
      <div className="modal-box flex !max-w-3xl flex-col gap-6 p-8">
        <h3 className="mb-4 text-lg font-bold">Workflow Progress</h3>
        <div className="mb-4">
          <ul className="steps w-full">
            {steps.map((step: { step: string; status: string }) => {
              let stepClass = "step ";
              if (step.status === "running") stepClass += "step-primary";
              else if (step.status === "success") stepClass += "step-success";
              else if (step.status === "error") stepClass += "step-error";
              return (
                <li key={step.step} className={stepClass}>
                  {step.status === "running" ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : null}
                  {stepLabels[step.step]}
                </li>
              );
            })}
          </ul>
          {txHash && (
            <div className="mt-4">
              <span className="font-semibold">Transaction Hash:</span>
              {selectedNetwork &&
              selectedNetwork.blockExplorers?.default?.url ? (
                <a
                  href={`${selectedNetwork.blockExplorers.default.url}/tx/${txHash}`}
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
          {error && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              {closeLabel}
            </button>
          )}
          {showGoToSafe && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onGoToSafe}
            >
              {goToSafeLabel}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
};

export { WorkflowModal };
