"use client";

import BtnCancel from "@/app/components/BtnCancel";
import AppCard from "@/app/components/AppCard";
import AppSection from "@/app/components/AppSection";
import AppAddress from "@/app/components/AppAddress";
import { useState, useEffect } from "react";
import { useAccount, useChains } from "wagmi";
import StepSigners from "./components/StepSigners";
import StepNetworks from "./components/StepNetworks";
import SafeDetails from "../components/SafeDetails";
import Stepper from "./components/Stepper";
import { WorkflowModal } from "@/app/components/WorkflowModal";
import { isValidAddress } from "../helpers";
import { CREATE_STEPS, STEPS_DEPLOY_LABEL } from "../constants";
import { useRouter } from "next/navigation";
import useNewSafe from "@/app/hooks/useNewSafe";
import { SafeDeployStep } from "@/app/utils/types";

export default function CreateSafeClient() {
  const { address: signer, chain } = useAccount();
  const chains = useChains();
  const router = useRouter();

  // Local UI state for feedback
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySteps, setDeploySteps] = useState<SafeDeployStep[]>([]);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployTxHash, setDeployTxHash] = useState<string | null>(null);

  const { predictNewSafeAddress, deployNewSafe } = useNewSafe();

  // Step management
  const [currentStep, setCurrentStep] = useState(0);

  // Multi-chain selection
  const [selectedChains, setSelectedChains] = useState<string[]>([]);

  // Owners state with auto-fill of connected wallet
  const [signers, setSigners] = useState<string[]>([""]);
  useEffect(() => {
    if (currentStep === 0 && signer) {
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

  // Step content as components (now with StepNetworks)
  const stepContent = [
    // Step 0: Chain selection
    <StepNetworks
      key="chains"
      chains={chains}
      selectedChains={selectedChains}
      setSelectedChains={setSelectedChains}
      onNext={() => setCurrentStep(1)}
    />,
    // Step 1: Owners/Threshold
    <StepSigners
      key="signers"
      signers={signers}
      threshold={threshold}
      addSignerField={addSignerField}
      removeSignerField={removeSignerField}
      handleSignerChange={handleSignerChange}
      setThreshold={setThreshold}
      onNext={() => setCurrentStep(2)}
      onBack={() => setCurrentStep(0)}
    />,
    null,
  ];

  // Modal state for deployment progress
  const [modalOpen, setModalOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Predict Safe address for all selected chains when entering validation step
  const [predictedAddresses, setPredictedAddresses] = useState<
    Record<string, `0x${string}` | null>
  >({});
  useEffect(() => {
    if (
      currentStep === 2 &&
      selectedChains.length > 0 &&
      signers.filter(Boolean).length > 0 &&
      threshold > 0
    ) {
      setIsPredicting(true);
      setPredictError(null);
      const validSigners = signers.filter(isValidAddress);
      const fetchPredictions = async () => {
        const results: Record<string, `0x${string}` | null> = {};
        for (const chainId of selectedChains) {
          try {
            const predictedAddress = await predictNewSafeAddress(
              validSigners,
              threshold,
              saltNonce,
              chainId,
            );
            results[chainId] = predictedAddress;
          } catch {
            results[chainId] = null;
          }
        }
        setPredictedAddresses(results);
        setIsPredicting(false);
      };
      fetchPredictions();
    }
  }, [
    currentStep,
    selectedChains,
    signers,
    threshold,
    predictNewSafeAddress,
    saltNonce,
  ]);

  // Deploy Safe
  async function handleDeploySafe() {
    setModalOpen(true);
    setIsDeploying(true);
    setDeployError(null);
    setDeploySteps([
      { step: "txCreated", status: "idle" },
      { step: "txSent", status: "idle" },
      { step: "confirmed", status: "idle" },
      { step: "deployed", status: "idle" },
    ]);
    setDeployTxHash(null);
    try {
      const validSigners = signers.filter(isValidAddress);
      const steps = await deployNewSafe(validSigners, threshold, saltNonce);
      setDeploySteps(steps);
      // If deployment successful, set txHash (if available)
      const deployedStep = steps.find(
        (s) => s.step === "deployed" && s.status === "success",
      );
      if (deployedStep && deployedStep.txHash) {
        setDeployTxHash(deployedStep.txHash);
      }
    } catch (e) {
      setDeployError("Deployment error");
    } finally {
      setIsDeploying(false);
    }
  }

  function handleCloseModal() {
    setModalOpen(false);
  }

  async function handleGoToSafe() {
    if (safePredictedAddress) {
      setRedirecting(true);
      router.push(`/safe/${safePredictedAddress}`);
    }
  }

  return (
    <>
      <AppSection>
        <div className="grid w-full grid-cols-6 items-center">
          <div className="self-start">
            <BtnCancel href="/new-safe" />
          </div>
          <Stepper
            steps={["Networks", ...CREATE_STEPS]}
            currentStep={currentStep}
          />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center">
          {currentStep === 2 ? (
            <AppCard title="Review & Validate Safe Account" className="w-full">
              <div className="mb-4">
                <h4 className="font-semibold">Selected Networks:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedChains.map((chainId) => {
                    const chainObj = chains.find(
                      (c) => c.id.toString() === chainId,
                    );
                    return (
                      <span
                        key={chainId}
                        className="badge badge-secondary badge-outline"
                      >
                        {chainObj ? chainObj.name : chainId}
                      </span>
                    );
                  })}
                </div>
              </div>
              <SafeDetails
                selectedNetwork={chain}
                signers={signers}
                threshold={threshold}
              />
              <div className="divider my-0" />
              <div className="flex flex-col gap-4">
                {isPredicting && (
                  <div className="flex items-center gap-2">
                    <span>Predicting Safe address</span>
                    <span className="loading loading-dots loading-xs" />
                  </div>
                )}
                {Object.keys(predictedAddresses).length > 0 && (
                  <div>
                    <p className="mb-1 text-lg font-semibold">
                      Predicted Safe Address:
                    </p>
                    <div className="flex flex-wrap gap-2 p-2">
                      <AppAddress
                        address={
                          Object.values(predictedAddresses).find(
                            (addr) => !!addr,
                          ) || "N/A"
                        }
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
                    Back to Owners
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={
                      selectedChains.length === 0 ||
                      Object.values(predictedAddresses).some((addr) => !addr) ||
                      isPredicting ||
                      isDeploying
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
                    selectedNetwork={chain}
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
        selectedNetwork={chain}
        onClose={handleCloseModal}
        onGoToSafe={handleGoToSafe}
        showGoToSafe={
          deploySteps.length > 0 &&
          deploySteps.every((s) => s.status === "success") &&
          !!deployTxHash &&
          !!Object.values(predictedAddresses).every((addr) => !!addr)
        }
        goToSafeLabel={redirecting ? "Redirecting..." : "Go to Safe"}
        closeLabel="Close"
      />
    </>
  );
}
