import { Chain } from "viem";

interface StepNetworksProps {
  chains: readonly Chain[];
  selectedChains: string[];
  setSelectedChains: (ids: string[]) => void;
  onNext: () => void;
}

export default function StepNetworks({
  chains,
  selectedChains,
  setSelectedChains,
  onNext,
}: StepNetworksProps) {
  return (
    <div className="mb-8">
      <h3 className="mb-2 text-lg font-semibold">Select Networks</h3>
      <div className="flex flex-wrap gap-2">
        {chains.map((chainObj) => (
          <label key={chainObj.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={selectedChains.includes(chainObj.id.toString())}
              onChange={() => {
                setSelectedChains(
                  selectedChains.includes(chainObj.id.toString())
                    ? selectedChains.filter(
                        (id) => id !== chainObj.id.toString(),
                      )
                    : [...selectedChains, chainObj.id.toString()],
                );
              }}
            />
            <span className="badge badge-outline">{chainObj.name}</span>
          </label>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className="btn btn-primary"
          disabled={selectedChains.length === 0}
          onClick={onNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
