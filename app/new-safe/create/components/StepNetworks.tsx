import BtnBackHistory from "@/app/components/BtnBackHistory";
import React from "react";
import { Chain } from "viem";

interface StepNetworksProps {
  chains: readonly Chain[];
  selectedNetworks: number[];
  handleCheckbox: (id: number) => void;
  handleReset: () => void;
  onNext: () => void;
}

export default function StepNetworks(props: StepNetworksProps) {
  const { chains, selectedNetworks, handleCheckbox, handleReset, onNext } =
    props;
  return (
    <div className="card card-lg card-border bg-base-100 col-span-6 shadow-xl md:col-span-4">
      <div className="card-body gap-8">
        <h2 className="card-title">Select Ethereum Networks</h2>
        <p className="text-base-content flex-none">
          Choose one or more Ethereum networks for your Safe account. You can
          reset your selection or proceed to the next step at any time.
        </p>
        <form
          className="flex flex-1 flex-wrap items-center gap-2"
          onReset={handleReset}
        >
          <input className="btn btn-square btn-sm" type="reset" value="×" />
          {chains.map((net) => (
            <input
              key={net.id}
              type="checkbox"
              className="btn btn-dash btn-secondary rounded"
              aria-label={net.name}
              checked={selectedNetworks.includes(net.id)}
              onChange={() => handleCheckbox(net.id)}
            />
          ))}
        </form>
        <div className="card-actions flex justify-between gap-4">
          <BtnBackHistory label="Cancel" />
          <button
            type="button"
            className="btn btn-primary rounded"
            onClick={onNext}
            disabled={selectedNetworks.length === 0}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
