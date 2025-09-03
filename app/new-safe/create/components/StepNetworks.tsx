import BtnBackHistory from "@/app/components/BtnBackHistory";
import React from "react";
import { Chain } from "viem";

interface StepNetworksProps {
  chains: readonly Chain[];
  selectedNetwork: number | undefined;
  handleSelect: (id: number) => void;
  onNext: () => void;
}

export default function StepNetworks({
  chains,
  selectedNetwork,
  handleSelect,
  onNext,
}: StepNetworksProps) {
  return (
    <div className="card card-lg card-border bg-base-100 col-span-6 shadow-xl md:col-span-4">
      <div className="card-body gap-8">
        <h2 className="card-title">Select Ethereum Network</h2>
        <p className="text-base-content flex-none">
          Choose one Ethereum network for your Safe account. You can add more
          networks later from the deployed Safe account.
        </p>
        <select
          className="select select-bordered select-primary w-full max-w-xs"
          aria-label="Select network"
          value={selectedNetwork ?? -1}
          disabled={!selectedNetwork}
          onChange={(e) => handleSelect(Number(e.target.value))}
        >
          <option value={-1} disabled>
            Choose network...
          </option>
          {chains.map((net) => (
            <option key={net.id} value={net.id}>
              {net.name}
            </option>
          ))}
        </select>
        <div className="card-actions flex justify-between gap-4">
          <BtnBackHistory label="Cancel" />
          <button
            type="button"
            className="btn btn-primary rounded"
            onClick={onNext}
            disabled={selectedNetwork === null}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
