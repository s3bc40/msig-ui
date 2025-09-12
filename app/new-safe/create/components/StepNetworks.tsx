import StepLayout from "./StepLayout";
import { Chain } from "viem";

interface StepNetworksProps {
  chains: readonly Chain[];
  selectedChains: Chain[];
  setSelectedChains: (chains: Chain[]) => void;
  onNext: () => void;
}

export default function StepNetworks({
  chains,
  selectedChains,
  setSelectedChains,
  onNext,
}: StepNetworksProps) {
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
      title="Networks"
      description="Select the networks you want to deploy your Safe on."
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
            />
          );
        })}
      </form>
    </StepLayout>
  );
}
