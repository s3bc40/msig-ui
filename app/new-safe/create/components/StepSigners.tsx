import React from "react";

interface StepSignersProps {
  signers: string[];
  threshold: number;
  addSignerField: () => void;
  removeSignerField: (idx: number) => void;
  handleSignerChange: (idx: number, value: string) => void;
  setThreshold: (value: number) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function StepSigners({
  signers,
  threshold,
  addSignerField,
  removeSignerField,
  handleSignerChange,
  setThreshold,
  onBack,
  onNext,
}: StepSignersProps) {
  return (
    <div className="card card-lg card-border bg-base-100 col-span-6 shadow-xl md:col-span-4">
      <div className="card-body gap-8">
        <h2 className="card-title">Signers and Threshold</h2>
        <p className="text-base-content mb-2">
          Here you will select the signers and set the threshold for your Safe
          account. (UI to be implemented)
        </p>
        <div className="flex flex-col gap-2">
          {signers.map((owner, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <fieldset className="fieldset w-full">
                <legend className="fieldset-legend">Owner {idx + 1}</legend>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => handleSignerChange(idx, e.target.value)}
                    placeholder="0x..."
                    className="input validator w-full"
                    pattern="^0x[a-fA-F0-9]{40}$"
                    required
                  />
                  {signers.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-outline btn-secondary"
                      onClick={() => removeSignerField(idx)}
                    >
                      -
                    </button>
                  )}
                </div>
              </fieldset>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-secondary btn-soft w-fit"
            onClick={addSignerField}
          >
            + Add Owner
          </button>
        </div>
        <fieldset className="fieldset w-full">
          <legend className="fieldset-legend">Threshold</legend>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={signers.length}
              step={1}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="input validator w-fit"
              required
            />
            <p className="text-sm">
              out of {signers.length} signers required to confirm a transaction
            </p>
          </div>
          <p className="validator-hint">
            Threshold must be between 1 and {signers.length}
          </p>
        </fieldset>

        <div className="card-actions mt-6 flex justify-between gap-4">
          <button
            type="button"
            className="btn btn-ghost btn-secondary rounded"
            onClick={onBack}
          >
            Back
          </button>
          <button
            type="button"
            className="btn btn-primary rounded"
            onClick={onNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
