import React from "react";
import { DeploymentModalProps } from "../types";

const stepLabels = {
  txCreated: "Tx Created",
  txSent: "Tx Sent",
  confirmed: "Confirmed",
  deployed: "Deployed",
};

const DeploymentModal: React.FC<DeploymentModalProps> = ({
  open,
  steps,
  deployTxHash,
  deployError,
  selectedNetwork,
}) => {
  if (!open) return null;
  return (
    <dialog
      id="safe_deploy_modal"
      className="modal modal-bottom sm:modal-middle"
      open
    >
      <div className="modal-box !max-w-3xl">
        <h3 className="mb-4 text-lg font-bold">Safe Deployment Progress</h3>
        <div className="mb-4">
          <ul className="steps w-full">
            {steps.map((step) => {
              let stepClass = "step ";
              if (step.status === "running") stepClass += "step-primary";
              else if (step.status === "success") stepClass += "step-success";
              else if (step.status === "error") stepClass += "step-error";
              return (
                <li key={step.step} className={stepClass}>
                  {stepLabels[step.step]}
                </li>
              );
            })}
          </ul>
          {deployTxHash && (
            <div className="mt-4">
              <span className="font-semibold">Transaction Hash:</span>
              {selectedNetwork &&
              selectedNetwork.blockExplorers?.default?.url ? (
                <a
                  href={`${selectedNetwork.blockExplorers.default.url}/tx/${deployTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary ml-2 font-mono text-xs break-all"
                >
                  {deployTxHash}
                </a>
              ) : (
                <span className="ml-2 font-mono text-xs break-all">
                  {deployTxHash}
                </span>
              )}
            </div>
          )}
          {deployError && (
            <div className="alert alert-error mt-4 w-full max-w-full overflow-x-auto break-words">
              <pre className="text-xs whitespace-pre-wrap">{deployError}</pre>
            </div>
          )}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

export default DeploymentModal;
