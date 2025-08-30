"use client";

import BtnBack from "@/app/components/BtnBackHistory";
import { useState } from "react";
import { useChains } from "wagmi";
import { type Chain } from "viem";

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
          <li className="text-sm text-gray-500">None selected</li>
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

  const chains = useChains();

  const handleCheckbox = (id: number) => {
    setSelectedNetworks((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id],
    );
  };

  const handleReset = () => setSelectedNetworks([]);

  return (
    <div className="mx-auto flex h-full min-h-full w-full flex-col items-center gap-6 p-10">
      <div className="flex w-full flex-col items-center justify-between sm:flex-row">
        <BtnBack />
        <ul className="steps mx-auto">
          <li className="step step-primary">Register</li>
          <li className="step step-primary">Choose plan</li>
          <li className="step">Purchase</li>
          <li className="step">Receive Product</li>
        </ul>
        <div className="hidden sm:block" style={{ width: "3rem" }} />
      </div>
      <div className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:justify-center lg:gap-8">
        {/* Filter Card: Select Ethereum Networks */}
        <div className="card card-lg bg-base-100 w-full flex-2 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Select Ethereum Networks</h2>
            <p className="text-base-content mb-2 text-sm">
              Choose one or more Ethereum networks for your Safe account. You
              can reset your selection or proceed to the next step at any time.
            </p>
            <form
              className="flex flex-wrap items-center gap-2"
              onReset={handleReset}
            >
              <input className="btn btn-square btn-sm" type="reset" value="×" />
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
              >
                Cancel
              </button>
              <button type="button" className="btn btn-primary rounded">
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Safe Info Card: Display Selected Networks */}
        <div className="card bg-base-100 card-lg w-full flex-1 shadow-xl">
          <div className="card-body items-center text-center">
            <h2 className="card-title">Safe Account Preview</h2>
            <SafeInfoCard chains={chains} selected={selectedNetworks} />
          </div>
        </div>
      </div>
    </div>
  );
}
