"use client";

import BtnBack from "@/app/components/BtnBackHistory";
import { useState, useEffect, useRef } from "react";
import { useAccount, useChains } from "wagmi";
import { type Chain } from "viem";
import StepNetworks from "./components/StepNetworks";
import StepSigners from "./components/StepSigners";
import { useSafe, SafeDeployStep } from "@/app/provider/SafeProvider";

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
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1 text-lg font-semibold">Selected Networks:</p>
        <div className="flex flex-wrap gap-2">
          {selected.length === 0 ? (
            <span className="badge badge-outline text-base-content">
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
          <div className="badge badge-outline">No signers added</div>
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

  const { isLoading, error, predictSafeAddress, deploySafe } = useSafe();

  // Error separation
  const [predictError, setPredictError] = useState<string | null>(null);

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

  // Owners state with auto-fill of connected wallet
  const [signers, setSigners] = useState<string[]>([""]);
  useEffect(() => {
    if (signer) {
      setSigners((prev) => {
        // Replace first entry with new signer, keep others
        if (prev.length === 0) return [signer];
        if (prev[0] !== signer) return [signer, ...prev.slice(1)];
        return prev;
      });
    }
  }, [signer]);
  // Helpers to manage dynamic signer fields
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

  // Threshold state
  const [threshold, setThreshold] = useState<number>(1);

  // Predicted Safe address state
  const [safePredictedAddress, setSafePredictedAddress] = useState<
    `0x${string}` | null
  >(null);

  // Salt nonce for Safe creation (number string for SDK compatibility)
  const [saltNonce, setSaltNonce] = useState<string>(() => {
    return Date.now().toString();
  });

  // Ref to cache last-used params and address
  const lastPredictionRef = useRef<{
    networks: number[];
    signers: string[];
    threshold: number;
    address: `0x${string}` | null;
  }>({
    networks: [],
    signers: [],
    threshold: 1,
    address: null,
  });

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
  // DaisyUI modal uses dialog element, so we don't need showModal state
  const [deployStatus, setDeployStatus] = useState<
    Record<number, SafeDeployStep>
  >({});
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  // Predict Safe address when entering validation step
  useEffect(() => {
    if (
      currentStep === 2 &&
      selectedNetworks.length > 0 &&
      signers.filter(Boolean).length > 0 &&
      threshold > 0
    ) {
      // Only pass valid addresses to SDK
      const validSigners = signers.filter((s): s is `0x${string}` =>
        /^0x[a-fA-F0-9]{40}$/.test(s),
      );
      // Compare current params to lastPredictionRef
      const paramsChanged =
        lastPredictionRef.current.networks.join(",") !==
          selectedNetworks.join(",") ||
        lastPredictionRef.current.signers.join(",") !== signers.join(",") ||
        lastPredictionRef.current.threshold !== threshold;
      if (paramsChanged) {
        setSafePredictedAddress(null);
        setPredictError(null);
        const fetchPredictedAddress = async () => {
          try {
            const predictedAddress = await predictSafeAddress(
              selectedNetworks
                .map((id) => chains.find((c) => c.id === id)!)
                .filter(Boolean),
              validSigners,
              threshold,
              saltNonce,
            );
            setSafePredictedAddress(predictedAddress);
            lastPredictionRef.current = {
              networks: [...selectedNetworks],
              signers: [...signers],
              threshold,
              address: predictedAddress,
            };
          } catch (e) {
            setPredictError(
              e instanceof Error ? e.message : "Prediction failed",
            );
          }
        };
        fetchPredictedAddress();
      } else {
        // Params unchanged, reuse cached address
        setSafePredictedAddress(lastPredictionRef.current.address);
      }
    }
  }, [
    currentStep,
    selectedNetworks,
    signers,
    threshold,
    chains,
    predictSafeAddress,
    signer,
    saltNonce,
  ]);

  // Deploy Safe on all selected chains
  async function handleDeploySafe() {
    // Open DaisyUI modal
    const modal = document.getElementById(
      "safe_deploy_modal",
    ) as HTMLDialogElement | null;
    if (modal) {
      modal.showModal();
    }
    setDeploying(true);
    setDeployStatus({});
    setDeployError(null);
    try {
      // Only pass valid addresses to SDK
      const validSigners = signers.filter((s): s is `0x${string}` =>
        /^0x[a-fA-F0-9]{40}$/.test(s),
      );
      const status: Record<number, SafeDeployStep> = {};
      const txs = await deploySafe(
        selectedNetworks
          .map((id) => chains.find((c) => c.id === id)!)
          .filter(Boolean),
        validSigners,
        threshold,
        saltNonce,
        (chainId, step) => {
          status[chainId] = step;
          setDeployStatus((prev) => ({ ...prev, [chainId]: step }));
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
              <div className="divider my-0" />
              <div className="flex flex-col gap-4">
                {isLoading && (
                  <div className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-md" />
                    <span>Predicting Safe address...</span>
                  </div>
                )}
                {safePredictedAddress && (
                  <div>
                    <p className="mb-1 text-lg font-semibold">
                      Predicted Safe Address:
                    </p>
                    <div className="flex flex-wrap items-center gap-2 p-2">
                      <span className="badge badge-success badge-outline text-base break-all">
                        {safePredictedAddress}
                      </span>
                    </div>
                  </div>
                )}
                {predictError && (
                  <div className="alert alert-error">{predictError}</div>
                )}
                <div className="mt-8" />
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
                    disabled={!safePredictedAddress || isLoading || deploying}
                    onClick={handleDeploySafe}
                  >
                    {deploying ? "Deploying..." : "Validate & Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* DaisyUI Modal for deployment progress */}
          <dialog
            id="safe_deploy_modal"
            className="modal modal-bottom sm:modal-middle"
          >
            <div className="modal-box">
              <h3 className="mb-4 text-lg font-bold">
                Safe Deployment Progress
              </h3>
              <ul className="mb-4">
                {selectedNetworks.map((id) => {
                  const net = chains.find((c) => c.id === id);
                  const step = deployStatus[id];
                  // DaisyUI stepper stages
                  const stages = [
                    { label: "Pending", key: "pending" },
                    { label: "Tx Sent", key: "txSent" },
                    { label: "Confirmed", key: "confirmed" },
                    { label: "Deployed", key: "deployed" },
                  ];
                  // Find current step index
                  const currentIdx = step
                    ? stages.findIndex((s) => s.key === step.status)
                    : -1;
                  return (
                    <li key={id} className="mb-6">
                      <span className="font-semibold">{net?.name || id}:</span>
                      <ul className="steps steps-vertical mt-2 w-full">
                        {stages.map((stage, idx) => (
                          <li
                            key={stage.key}
                            className={
                              "step text-xs" +
                              (currentIdx > idx
                                ? " step-success"
                                : currentIdx === idx
                                  ? step?.status === "error"
                                    ? " step-error"
                                    : " step-primary"
                                  : "")
                            }
                          >
                            {stage.label}
                            {/* Show spinner for current step if pending/txSent */}
                            {currentIdx === idx &&
                              (step?.status === "pending" ||
                                step?.status === "txSent") && (
                                <span className="loading loading-spinner loading-xs ml-2" />
                              )}
                            {/* Show txHash for txSent/confirmed/deployed */}
                            {step?.txHash && idx >= 1 && currentIdx >= idx && (
                              <span className="badge badge-info badge-outline badge-xs ml-2">
                                Tx: {step.txHash}
                              </span>
                            )}
                          </li>
                        ))}
                        {/* Error step */}
                        {step?.status === "error" && (
                          <li className="alert alert-error text-xs">
                            Error
                            {step.error && <span>{step.error}</span>}
                          </li>
                        )}
                        {/* Not started */}
                        {!step && <li className="step text-xs">Not started</li>}
                      </ul>
                    </li>
                  );
                })}
              </ul>
              {deployError && (
                <div className="alert alert-error mb-2">{deployError}</div>
              )}
              <div className="modal-action">
                <form method="dialog">
                  <button className="btn" disabled={deploying}>
                    Close
                  </button>
                </form>
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button>close</button>
            </form>
          </dialog>
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
