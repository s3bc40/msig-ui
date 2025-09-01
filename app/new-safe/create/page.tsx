"use client";

import BtnBack from "@/app/components/BtnBackHistory";
import { useState, useEffect } from "react";
import { useAccount, useChains } from "wagmi";
import { type Chain } from "viem";
import StepNetworks from "./components/StepNetworks";
import StepSigners from "./components/StepSigners";
import { useSafe } from "@/app/provider/SafeProvider";

const steps = ["Networks", "Signers & Threshold", "Validate"];

function SafeDetails({
  chains,
  selected,
  signers,
  threshold,
}: {
  chains: readonly Chain[];
  selected: number[];
  signers: string[];
  threshold: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-lg font-semibold">Selected Networks:</p>
        <div className="flex flex-wrap gap-2">
          {selected.length === 0 ? (
            <span className="badge badge-soft text-base-content">
              None selected
            </span>
          ) : (
            selected.map((id) => {
              const net = chains.find((n) => n.id === id);
              return (
                <span key={id} className="badge badge-secondary badge-outline">
                  {net?.name || id}
                </span>
              );
            })
          )}
        </div>
      </div>
      <div className="divider my-0" />
      <div>
        <p className="mb-1 text-lg font-semibold">Signers:</p>
        {signers.length === 0 || signers.every((s) => !s) ? (
          <div className="alert alert-info">No signers added</div>
        ) : (
          <div className="flex flex-col gap-2">
            {signers.map((address, idx) =>
              address ? (
                <div
                  key={idx}
                  className="bg-base-200 w-full rounded px-2 py-1 font-mono text-sm break-all"
                >
                  <span className="mr-2 font-bold">{idx + 1}.</span>
                  {address}
                </div>
              ) : null,
            )}
          </div>
        )}
      </div>
      <div className="divider my-0" />
      <div>
        <p className="mb-1 text-lg font-semibold">Threshold:</p>
        <div className="flex flex-wrap items-center gap-2 p-2">
          <span className="badge badge-success text-base font-bold">
            {threshold} / {signers.length}
          </span>
          <span className="text-sm">signers required</span>
        </div>
      </div>
    </div>
  );
}

export default function CreateSafePage() {
  const chains = useChains();
  const { address: signer } = useAccount();

  const { safeAddress, isLoading, error, predictSafeAddress, deploySafe } =
    useSafe();

  // Step management
  const [currentStep, setCurrentStep] = useState(0);

  // Network selection state
  const [selectedNetworks, setSelectedNetworks] = useState<number[]>([]);
  function handleCheckbox(id: number) {
    setSelectedNetworks((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id],
    );
  }
  function handleReset() {
    setSelectedNetworks([]);
  }

  // Owners and threshold state
  const [signers, setSigners] = useState<string[]>([""]);
  const [threshold, setThreshold] = useState<number>(0);
  function addSignerField() {
    setSigners((prev) => [...prev, ""]);
  }
  function removeSignerField(signerIdx: number) {
    setSigners((prev) => prev.filter((_, idx) => idx !== signerIdx));
  }
  function handleSignerChange(signerIdx: number, value: string) {
    setSigners((prevSigners) =>
      prevSigners.map((owner, idx) => (idx === signerIdx ? value : owner)),
    );
  }

  // Step content as components
  const stepContent = [
    <StepNetworks
      key="networks"
      chains={chains}
      selectedNetworks={selectedNetworks}
      handleCheckbox={handleCheckbox}
      handleReset={handleReset}
      onNext={() => setCurrentStep(1)}
    />,
    <StepSigners
      key="signers"
      signers={signers}
      threshold={threshold}
      addSignerField={addSignerField}
      removeSignerField={removeSignerField}
      handleSignerChange={handleSignerChange}
      setThreshold={setThreshold}
      onBack={() => setCurrentStep(0)}
      onNext={() => setCurrentStep(2)}
    />,
    null,
  ];

  // Modal state for deployment progress
  const [showModal, setShowModal] = useState(false);
  const [deployStatus, setDeployStatus] = useState<Record<number, string>>({});
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  // Predict Safe address when entering validation step
  useEffect(() => {
    if (
      currentStep === 2 &&
      selectedNetworks.length > 0 &&
      signers.length > 0 &&
      threshold > 0
    ) {
      predictSafeAddress(
        chains.filter((c) => selectedNetworks.includes(c.id)),
        {
          owners: signers,
          threshold,
          signer,
        },
      );
    }
  }, [
    currentStep,
    selectedNetworks,
    signers,
    threshold,
    chains,
    predictSafeAddress,
    signer,
  ]);

  // Deploy Safe on all selected chains
  async function handleDeploySafe() {
    setShowModal(true);
    setDeploying(true);
    setDeployStatus({});
    setDeployError(null);
    try {
      const txs = await deploySafe(
        chains.filter((c) => selectedNetworks.includes(c.id)),
        {
          owners: signers,
          threshold,
          signer,
        },
      );
      setDeployStatus(txs);
    } catch (e) {
      setDeployError(e instanceof Error ? e.message : "Deployment failed");
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-12 p-10">
      <div className="grid w-full grid-cols-6 items-center">
        <div className="self-start">
          <BtnBack />
        </div>
        <ul className="steps col-span-4">
          {steps.map((label, idx) => (
            <li
              key={label}
              className={
                "text-base-content step text-sm" +
                (idx < currentStep
                  ? " step-primary"
                  : idx === currentStep
                    ? " step-primary"
                    : "")
              }
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
      {currentStep === 2 ? (
        <>
          <div className="card card-border bg-base-100 card-xl w-full shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-6">
                Review & Validate Safe Account
              </h2>
              <SafeDetails
                chains={chains}
                selected={selectedNetworks}
                signers={signers}
                threshold={threshold}
              />
              <div className="mt-8 flex flex-col gap-4">
                {isLoading && (
                  <div className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-md" />
                    <span>Predicting Safe address...</span>
                  </div>
                )}
                {safeAddress && (
                  <div className="alert alert-success">
                    <span>Predicted Safe address: </span>
                    <span className="font-mono">{safeAddress}</span>
                  </div>
                )}
                {error && <div className="alert alert-error">{error}</div>}
                <div className="flex justify-between gap-4">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCurrentStep(1)}
                  >
                    Back to Signers
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!safeAddress || isLoading || deploying}
                    onClick={handleDeploySafe}
                  >
                    {deploying ? "Deploying..." : "Validate & Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Global Modal for deployment progress */}
          {showModal && (
            <div className="bg-opacity-40 fixed inset-0 z-50 flex items-center justify-center bg-black">
              <div className="modal-box w-full max-w-lg">
                <h3 className="mb-4 text-lg font-bold">
                  Safe Deployment Progress
                </h3>
                <ul className="mb-4">
                  {selectedNetworks.map((id) => {
                    const net = chains.find((c) => c.id === id);
                    return (
                      <li key={id} className="mb-2">
                        <span className="font-semibold">
                          {net?.name || id}:
                        </span>
                        {deploying ? (
                          <span className="loading loading-spinner loading-xs ml-2" />
                        ) : deployStatus[id] ? (
                          <span className="text-success ml-2">
                            Tx Hash: {deployStatus[id]}
                          </span>
                        ) : (
                          <span className="text-error ml-2">
                            Error or not started
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {deployError && (
                  <div className="alert alert-error mb-2">{deployError}</div>
                )}
                <div className="modal-action">
                  <button
                    className="btn"
                    onClick={() => setShowModal(false)}
                    disabled={deploying}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="grid w-full grid-cols-6 gap-8">
          {stepContent[currentStep]}
          {/* Safe Info Card: Display Selected Networks */}
          <div className="card card-border bg-base-100 card-xl col-span-4 col-start-2 shadow-xl md:col-span-2 md:col-start-auto">
            <div className="card-body">
              <h2 className="card-title">Safe Account Preview</h2>
              <SafeDetails
                chains={chains}
                selected={selectedNetworks}
                signers={signers}
                threshold={threshold}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
