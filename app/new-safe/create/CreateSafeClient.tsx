"use client";

import BtnBack from "@/app/components/BtnBackHistory";
import { useState, useEffect, useRef } from "react";
import { useAccount, useChains, useClient } from "wagmi";
import { type Chain } from "viem";
import StepNetworks from "./components/StepNetworks";
import StepSigners from "./components/StepSigners";
import SafeDetails from "../components/SafeDetails";
import Stepper from "./components/Stepper";
import DeploymentModal from "./components/DeploymentModal";
import { useSafe } from "@/app/provider/SafeProvider";
import { isValidAddress, havePredictionParamsChanged } from "../helpers";
import { LastPredictionRef } from "../types";
import { SafeDeployStep } from "@/app/provider/types";
import { CREATE_STEPS } from "../constants";

export default function CreateSafeClient() {
  const client = useClient();
  const chains = useChains();
  const { address: signer, isConnected } = useAccount();

  const {
    isPredicting,
    isDeploying,
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
  const [saltNonce] = useState<string>(() => {
    return Date.now().toString();
  });

  // Ref to cache last-used params and address
  const lastPredictionRef = useRef<LastPredictionRef>({
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
  const [modalOpen, setModalOpen] = useState(false);

  // Predict Safe address when entering validation step
  useEffect(() => {
    if (
      currentStep === 2 &&
      selectedNetwork &&
      signers.filter(Boolean).length > 0 &&
      threshold > 0
    ) {
      // Only pass valid addresses to SDK
      const validSigners = signers.filter(isValidAddress);
      // Compare current params to lastPredictionRef
      const paramsChanged = havePredictionParamsChanged(
        lastPredictionRef.current,
        { network: selectedNetwork, signers, threshold },
      );
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
    setModalOpen(true);
    try {
      // Only pass valid addresses to SDK
      const validSigners = signers.filter(isValidAddress);
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
    }
  }

  function handleCloseModal() {
    setModalOpen(false);
    // Optionally reset deployStatus, redirect, or reset form here
  }

  return (
    <div className="flex w-full flex-col gap-12 p-10">
      <div className="grid w-full grid-cols-6 items-center">
        <div className="self-start">
          <BtnBack />
        </div>
        <Stepper steps={CREATE_STEPS} currentStep={currentStep} />
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
                {isPredicting && (
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
                    disabled={
                      !safePredictedAddress || isPredicting || isDeploying
                    }
                    onClick={handleDeploySafe}
                  >
                    {isDeploying ? "Deploying..." : "Validate & Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <DeploymentModal
            open={modalOpen}
            steps={deployStatus}
            deployTxHash={deployTxHash}
            deployError={deployError}
            selectedNetwork={selectedNetwork}
            onClose={handleCloseModal}
          />
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
