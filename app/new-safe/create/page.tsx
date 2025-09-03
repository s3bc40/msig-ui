"use client";

import BtnBack from "@/app/components/BtnBackHistory";
import { useState, useEffect, useRef } from "react";
import { useAccount, useChains, useClient } from "wagmi";
import { type Chain } from "viem";
import StepNetworks from "./components/StepNetworks";
import StepSigners from "./components/StepSigners";
import { useSafe, SafeDeployStep } from "@/app/provider/SafeProvider";

const steps = ["Networks", "Signers & Threshold", "Validate"];

function SafeDetails({
  selectedNetwork,
  signers,
  threshold,
}: {
  selectedNetwork: Chain | undefined;
  signers: string[];
  threshold: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1 text-lg font-semibold">Selected Networks:</p>
        <div className="flex flex-wrap gap-2">
          {!selectedNetwork ? (
            <span className="badge badge-outline text-base-content">
              None selected
            </span>
          ) : (
            <span
              key={selectedNetwork.id}
              className="badge badge-secondary badge-outline"
            >
              {selectedNetwork.name}
            </span>
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
  const client = useClient();
  const { address: signer, isConnected } = useAccount();

  const {
    isLoading,
    predictSafeAddress,
    deploySafe,
    deployError,
    deployTxHash,
  } = useSafe();

  // Error separation
  const [predictError, setPredictError] = useState<string | null>(null);

  // Step management
  const [currentStep, setCurrentStep] = useState(0);

  // Network selection state
  const [selectedNetwork, setSelectedNetwork] = useState<Chain>();
  useEffect(() => {
    if (client?.chain) {
      setSelectedNetwork(client.chain);
    }
  }, [client?.chain]);

  function handleSelect(id: number) {
    const chain = chains.find((c) => c.id === id);
    if (chain) {
      setSelectedNetwork(chain);
    }
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
    network: Chain;
    signers: string[];
    threshold: number;
    address: `0x${string}` | null;
  }>({
    network: {} as Chain,
    signers: [],
    threshold: 1,
    address: null,
  });

  // Step content as components
  const stepContent = [
    <StepNetworks
      key="networks"
      chains={chains}
      selectedNetwork={isConnected ? selectedNetwork?.id : undefined}
      handleSelect={handleSelect}
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
  const [deployStatus, setDeployStatus] = useState<SafeDeployStep[]>([]);
  const [deploying, setDeploying] = useState(false);

  // Predict Safe address when entering validation step
  useEffect(() => {
    if (
      currentStep === 2 &&
      selectedNetwork &&
      signers.filter(Boolean).length > 0 &&
      threshold > 0
    ) {
      // Only pass valid addresses to SDK
      const validSigners = signers.filter((s): s is `0x${string}` =>
        /^0x[a-fA-F0-9]{40}$/.test(s),
      );
      // Compare current params to lastPredictionRef
      const paramsChanged =
        lastPredictionRef.current.network !== selectedNetwork ||
        lastPredictionRef.current.signers.join(",") !== signers.join(",") ||
        lastPredictionRef.current.threshold !== threshold;
      if (paramsChanged) {
        setSafePredictedAddress(null);
        setPredictError(null);
        const fetchPredictedAddress = async () => {
          try {
            const predictedAddress = await predictSafeAddress(
              selectedNetwork,
              validSigners,
              threshold,
              saltNonce,
            );
            setSafePredictedAddress(predictedAddress);
            lastPredictionRef.current = {
              network: selectedNetwork,
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
    selectedNetwork,
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
    try {
      // Only pass valid addresses to SDK
      const validSigners = signers.filter((s): s is `0x${string}` =>
        /^0x[a-fA-F0-9]{40}$/.test(s),
      );
      await deploySafe(
        selectedNetwork!,
        validSigners,
        threshold,
        saltNonce,
        (stepsArr) => {
          setDeployStatus(stepsArr);
        },
      );
    } catch (e) {
      console.error("Deployment error:", e);
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
                selectedNetwork={selectedNetwork!}
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
            <div className="modal-box !max-w-3xl">
              <h3 className="mb-4 text-lg font-bold">
                Safe Deployment Progress
              </h3>
              <div className="mb-4">
                {(() => {
                  const stepsArr = deployStatus;
                  const stepLabels = {
                    txCreated: "Tx Created",
                    txSent: "Tx Sent",
                    confirmed: "Confirmed",
                    deployed: "Deployed",
                  };
                  console.log("StepsArr:", stepsArr);
                  return stepsArr && stepsArr.length > 0 ? (
                    <>
                      <ul className="steps w-full">
                        {stepsArr.map((step) => {
                          let stepClass = "step ";
                          if (step.status === "running")
                            stepClass += "step-primary";
                          else if (step.status === "success")
                            stepClass += "step-success";
                          else if (step.status === "error")
                            stepClass += "step-error";
                          return (
                            <li key={step.step} className={stepClass}>
                              {stepLabels[step.step]}
                            </li>
                          );
                        })}
                      </ul>
                      {/* Display txHash below the stepper if available */}
                      {deployTxHash && (
                        <div className="mt-4">
                          <span className="font-semibold">
                            Transaction Hash:
                          </span>
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
                          <pre className="text-xs whitespace-pre-wrap">
                            {deployError}
                          </pre>
                        </div>
                      )}
                    </>
                  ) : null;
                })()}
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
                selectedNetwork={isConnected ? selectedNetwork : undefined}
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
