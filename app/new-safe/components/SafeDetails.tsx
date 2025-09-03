import { type Chain } from "viem";

interface SafeDetailsProps {
  selectedNetwork: Chain | undefined;
  signers: string[];
  threshold: number;
}

export default function SafeDetails({
  selectedNetwork,
  signers,
  threshold,
}: SafeDetailsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1 text-lg font-semibold">Selected Networks:</p>
        <div className="flex flex-wrap gap-2">
          {!selectedNetwork ? (
            <span className="badge badge-outline text-base-content">
              None selected
            </span>
          ) : (
            <span
              key={selectedNetwork.id}
              className="badge badge-secondary badge-outline"
            >
              {selectedNetwork.name}
            </span>
          )}
        </div>
      </div>
      <div className="divider my-0" />
      <div>
        <p className="mb-1 text-lg font-semibold">Signers:</p>
        {signers.length === 0 || signers.every((s) => !s) ? (
          <div className="badge badge-outline">No signers added</div>
        ) : (
          <div className="flex flex-col gap-2">
            {signers.map((address, idx) =>
              address ? (
                <div
                  key={idx}
                  className="bg-base-200 w-full rounded px-2 py-1 font-mono text-sm break-all"
                >
                  <span className="mr-2 font-bold">{idx + 1}.</span>
                  {address}
                </div>
              ) : null,
            )}
          </div>
        )}
      </div>
      <div className="divider my-0" />
      <div>
        <p className="mb-1 text-lg font-semibold">Threshold:</p>
        <div className="flex flex-wrap items-center gap-2 p-2">
          <span className="badge badge-success text-base font-bold">
            {threshold} / {signers.length}
          </span>
          <span className="text-sm">signers required</span>
        </div>
      </div>
    </div>
  );
}
