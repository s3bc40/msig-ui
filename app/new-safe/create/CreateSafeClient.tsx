"use client";

import BtnCancel from "@/app/components/BtnCancel";
import AppCard from "@/app/components/AppCard";
import AppSection from "@/app/components/AppSection";
import AppAddress from "@/app/components/AppAddress";
import { useState, useEffect, useRef } from "react";
import { useAccount, useChains } from "wagmi";
import { type Chain } from "viem";
import StepNetworks from "./components/StepNetworks";
import StepSigners from "./components/StepSigners";
import SafeDetails from "../components/SafeDetails";
import Stepper from "./components/Stepper";
import { WorkflowModal } from "@/app/components/WorkflowModal";
import { isValidAddress, havePredictionParamsChanged } from "../helpers";
import { LastPredictionRef } from "../types";
import { CREATE_STEPS, STEPS_DEPLOY_LABEL } from "../constants";
import { useRouter } from "next/navigation";
import { useSafeContext } from "@/app/hooks/useSafeContext";

export default function CreateSafeClient() {
  const chains = useChains();
  const { address: signer, chain, isConnected } = useAccount();
  const router = useRouter();

  const {
    predictSafeAddress,
    deploySafe,
    resetSafe,
    isPredicting,
    isDeploying,
    deploySteps,
    deployError,
    deployTxHash,
    currentProtcolKit,
  } = useSafeContext();

  // Error separation
  const [predictError, setPredictError] = useState<string | null>(null);

  // Step management
  const [currentStep, setCurrentStep] = useState(0);

  // Network selection state
  const [selectedNetwork, setSelectedNetwork] = useState<Chain>();
  useEffect(() => {
    if (currentStep === 0 && chain) {
      setSelectedNetwork(chain);
    }
    // Do not update selectedNetwork if not at network selection step
  }, [chain, currentStep]);

  function handleSelect(id: number) {
    const chain = chains.find((c) => c.id === id);
    if (chain) {
      setSelectedNetwork(chain);
    }
  }

  // Owners state with auto-fill of connected wallet
  const [signers, setSigners] = useState<string[]>([""]);
  useEffect(() => {
    if (currentStep === 1 && signer) {
      setSigners((prev) => {
        // Replace first entry with new signer, keep others
        if (prev.length === 0) return [signer];
        if (prev[0] !== signer) return [signer, ...prev.slice(1)];
        return prev;
      });
    }
    // Do not update signers if not at signers selection step
  }, [signer, currentStep]);
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
  const [modalOpen, setModalOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

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

  // Deploy Safe
  async function handleDeploySafe() {
    // Clear previous state
    resetSafe();
    setModalOpen(true);
    try {
      // Only pass valid addresses to SDK
      const validSigners = signers.filter(isValidAddress);
      await deploySafe(selectedNetwork!, validSigners, threshold, saltNonce);
    } catch (e) {
      console.error("Deployment error:", e);
    }
  }

  function handleCloseModal() {
    setModalOpen(false);
  }

  async function handleGoToSafe() {
    const safeAddress = await currentProtcolKit?.getAddress();
    if (safeAddress) {
      setRedirecting(true);
      router.push(`/safe/${safeAddress}`);
    }
  }

  return (
    <>
      <AppSection>
        <div className="grid w-full grid-cols-6 items-center">
          <div className="self-start">
            <BtnCancel href="/new-safe" />
          </div>
          <Stepper steps={CREATE_STEPS} currentStep={currentStep} />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center">
          {currentStep === 2 ? (
            <AppCard title="Review & Validate Safe Account" className="w-full">
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
                    <div className="flex flex-wrap gap-2 p-2">
                      <AppAddress
                        address={safePredictedAddress}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
                {predictError && (
                  <div className="alert alert-error">{predictError}</div>
                )}
                <div className="mt-4 flex justify-between gap-2">
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
            </AppCard>
          ) : (
            <div className="grid w-full grid-cols-12 gap-8">
              {stepContent[currentStep]}
              {/* Safe Info Card: Display Selected Networks */}
              <div className="col-span-10 col-start-2 md:col-span-5 md:col-start-auto">
                <AppCard title="Safe Account Preview">
                  <SafeDetails
                    selectedNetwork={isConnected ? selectedNetwork : undefined}
                    signers={signers}
                    threshold={threshold}
                  />
                </AppCard>
              </div>
            </div>
          )}
        </div>
      </AppSection>
      {/* Modal outside of container flex */}
      <WorkflowModal
        open={modalOpen}
        steps={deploySteps}
        stepLabels={STEPS_DEPLOY_LABEL}
        txHash={deployTxHash}
        error={deployError}
        selectedNetwork={selectedNetwork}
        onClose={handleCloseModal}
        onGoToSafe={handleGoToSafe}
        showGoToSafe={
          deploySteps.length > 0 &&
          deploySteps.every((s) => s.status === "success") &&
          !!deployTxHash &&
          !!safePredictedAddress
        }
        goToSafeLabel={redirecting ? "Redirecting..." : "Go to Safe"}
        closeLabel="Close"
      />
    </>
  );
}
