import { sanitizeUserInput } from "@/app/utils/helpers";
import StepLayout from "./StepLayout";
import { Chain } from "viem";

export interface StepNameAndNetworksProps {
  chains: readonly Chain[];
  selectedChains: Chain[];
  setSelectedChains: (chains: Chain[]) => void;
  onNext: () => void;
  safeName: string;
  setSafeName: (name: string) => void;
  placeholder: string;
}

export default function StepNameAndNetworks({
  chains,
  selectedChains,
  setSelectedChains,
  onNext,
  safeName,
  setSafeName,
  placeholder,
}: StepNameAndNetworksProps) {
  function toggleChain(chain: Chain) {
    const exists = selectedChains.some((c) => c.id === chain.id);
    setSelectedChains(
      exists
        ? selectedChains.filter((c) => c.id !== chain.id)
        : [...selectedChains, chain],
    );
  }

  return (
    <StepLayout
      title="Safe Name & Networks"
      description="Enter a name for your Safe and select the networks to deploy on. Both will be registered."
      actions={
        <button
          type="button"
          className="btn btn-primary"
          disabled={selectedChains.length === 0}
          onClick={onNext}
        >
          Next
        </button>
      }
    >
      <fieldset className="fieldset col-span-2">
        <legend className="fieldset-legend">Safe Name</legend>
        <div className="flex items-center gap-2">
          <input
            id="safeName"
            type="text"
            value={safeName}
            onChange={(e) => setSafeName(sanitizeUserInput(e.target.value))}
            placeholder={placeholder}
            className="input input-bordered flex-1"
            data-testid="safe-name-input"
          />
        </div>
        <label className="label">
          <span className="label-text-alt">
            If left blank, a random name will be generated.
          </span>
        </label>
      </fieldset>
      <fieldset className="fieldset col-span-2">
        <legend className="fieldset-legend">Networks</legend>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            className="btn btn-square btn-sm"
            type="reset"
            value="×"
            aria-label="Reset selection"
            onClick={() => setSelectedChains([])}
            data-testid="network-reset-btn"
          />
          {chains.map((chainObj) => {
            const selected = selectedChains.some((c) => c.id === chainObj.id);
            return (
              <input
                key={chainObj.id}
                type="button"
                className={`btn btn-sm rounded ${selected ? "btn-accent" : "btn-outline"}`}
                value={chainObj.name}
                aria-label={chainObj.name}
                onClick={() => toggleChain(chainObj)}
                data-testid={`network-badge-btn-${chainObj.id}`}
              />
            );
          })}
        </form>
      </fieldset>
    </StepLayout>
  );
}
