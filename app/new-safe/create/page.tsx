"use client";

import BtnBack from "@/app/components/BtnBackHistory";
import { useState } from "react";
import { useChains } from "wagmi";
import { type Chain } from "viem";
import StepNetworks from "./components/StepNetworks";
import StepSigners from "./components/StepSigners";
import StepValidate from "./components/StepValidate";

const steps = ["Networks", "Signers & Threshold", "Validate"];

function SafeInfoCard({
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
        <p className="mb-1 font-semibold">Selected Networks:</p>
        <div className="flex flex-wrap gap-2">
          {selected.length === 0 ? (
            <span className="badge badge-soft text-base-content">
              None selected
            </span>
          ) : (
            selected.map((id) => {
              const net = chains.find((n) => n.id === id);
              return (
                <span key={id} className="badge badge-accent badge-soft">
                  {net?.name || id}
                </span>
              );
            })
          )}
        </div>
      </div>
      <div className="divider my-0" />
      <div>
        <p className="mb-1 font-semibold">Signers:</p>
        {signers.length === 0 || signers.every((s) => !s) ? (
          <div className="alert alert-info">No signers added</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-zebra table w-full">
              <tbody>
                {signers.map((address, idx) =>
                  address ? (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{address}</td>
                    </tr>
                  ) : null,
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="divider my-0" />
      <div>
        <p className="mb-1 font-semibold">Threshold:</p>
        <div className="alert alert-success">
          <span>
            <b>{threshold}</b> out of <b>{signers.length}</b> signers required
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CreateSafePage() {
  const chains = useChains();

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
    <StepValidate
      key="validate"
      onBack={() => setCurrentStep(1)}
      onConfirm={() => {
        /* finalize logic */
      }}
    />,
  ];

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
      <div className="grid w-full grid-cols-6 gap-8">
        {stepContent[currentStep]}
        {/* Safe Info Card: Display Selected Networks */}
        <div className="card card-border bg-base-100 card-xl col-span-4 col-start-2 flex flex-col shadow-xl md:col-span-2 md:col-start-auto">
          <div className="card-body">
            <h2 className="card-title">Safe Account Preview</h2>
            <SafeInfoCard
              chains={chains}
              selected={selectedNetworks}
              signers={signers}
              threshold={threshold}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
