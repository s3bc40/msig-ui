"use client";

import BtnBack from "@/app/components/BtnBackHistory";
import { useState } from "react";
import { useChains } from "wagmi";
import { type Chain } from "viem";

const steps = ["Networks", "Signers & Threshold", "Validate"];

function SafeInfoCard({
  chains,
  selected,
}: {
  chains: readonly Chain[];
  selected: number[];
}) {
  return (
    <div>
      <p className="font-semibold">Selected Networks:</p>
      <ul className="ml-4 list-disc">
        {selected.length === 0 ? (
          <li className="text-base-content">None selected</li>
        ) : (
          selected.map((id) => {
            const net = chains.find((n) => n.id === id);
            return <li key={id}>{net?.name || id}</li>;
          })
        )}
      </ul>
    </div>
  );
}

export default function CreateSafePage() {
  const [selectedNetworks, setSelectedNetworks] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const chains = useChains();

  const handleCheckbox = (id: number) => {
    setSelectedNetworks((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id],
    );
  };

  const handleReset = () => setSelectedNetworks([]);

  // Content for each step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="card card-lg bg-base-100 col-span-6 shadow-xl md:col-span-4">
            <div className="card-body gap-8">
              <h2 className="card-title">Select Ethereum Networks</h2>
              <p className="text-base-content mb-2 text-sm">
                Choose one or more Ethereum networks for your Safe account. You
                can reset your selection or proceed to the next step at any
                time.
              </p>
              <form
                className="flex flex-wrap items-center gap-2"
                onReset={handleReset}
              >
                <input
                  className="btn btn-square btn-sm"
                  type="reset"
                  value="×"
                />
                {chains.map((net) => (
                  <input
                    key={net.id}
                    type="checkbox"
                    className="btn btn-dash btn-secondary btn-sm rounded"
                    aria-label={net.name}
                    checked={selectedNetworks.includes(net.id)}
                    onChange={() => handleCheckbox(net.id)}
                  />
                ))}
              </form>
              <div className="card-actions mt-6 flex justify-between gap-4">
                <button
                  type="button"
                  className="btn btn-ghost btn-secondary rounded"
                  onClick={() => setCurrentStep(0)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary rounded"
                  onClick={() =>
                    setCurrentStep((s) => Math.min(s + 1, steps.length - 1))
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="card card-lg bg-base-100 col-span-6 shadow-xl md:col-span-4">
            <div className="card-body gap-8">
              <h2 className="card-title">Signers and Threshold</h2>
              <p className="text-base-content mb-2 text-sm">
                Here you will select the signers and set the threshold for your
                Safe account. (UI to be implemented)
              </p>
              <div className="card-actions mt-6 flex justify-between gap-4">
                <button
                  type="button"
                  className="btn btn-ghost btn-secondary rounded"
                  onClick={() => setCurrentStep((s) => Math.max(s - 1, 0))}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary rounded"
                  onClick={() =>
                    setCurrentStep((s) => Math.min(s + 1, steps.length - 1))
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="card card-lg bg-base-100 col-span-6 shadow-xl md:col-span-4">
            <div className="card-body gap-8">
              <h2 className="card-title">Validate</h2>
              <p className="text-base-content mb-2 text-sm">
                Review and validate your Safe account setup. (UI to be
                implemented)
              </p>
              <div className="card-actions mt-6 flex justify-between gap-4">
                <button
                  type="button"
                  className="btn btn-ghost btn-secondary rounded"
                  onClick={() => setCurrentStep((s) => Math.max(s - 1, 0))}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary rounded"
                  // onClick={...finalize logic...}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

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
        {renderStepContent()}
        {/* Safe Info Card: Display Selected Networks */}
        <div className="card bg-base-100 card-lg col-span-4 col-start-2 flex flex-col shadow-xl md:col-span-2 md:col-start-auto">
          <div className="card-body flex flex-1 flex-col place-content-start">
            <h2 className="card-title">Safe Account Preview</h2>
            <SafeInfoCard chains={chains} selected={selectedNetworks} />
          </div>
        </div>
      </div>
    </div>
  );
}
