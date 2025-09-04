import BtnBackHistory from "@/app/components/BtnBackHistory";
import React from "react";
import { Chain } from "viem";
import StepLayout from "./StepLayout";

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
    <StepLayout
      title="Select Ethereum Network"
      description="Choose one Ethereum network for your Safe account. You can add more networks later from the deployed Safe account."
      actions={
        <>
          <BtnBackHistory label="Cancel" />
          <button
            type="button"
            className="btn btn-primary rounded"
            onClick={onNext}
            disabled={selectedNetwork === null}
          >
            Next
          </button>
        </>
      }
    >
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
    </StepLayout>
  );
}
