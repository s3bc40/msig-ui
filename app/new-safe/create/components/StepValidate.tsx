import React from "react";

interface StepValidateProps {
  onBack: () => void;
  onConfirm: () => void;
}

export default function StepValidate({ onBack, onConfirm }: StepValidateProps) {
  return (
    <div className="card card-lg card-border bg-base-100 col-span-6 shadow-xl md:col-span-4">
      <div className="card-body gap-8">
        <h2 className="card-title">Validate</h2>
        <p className="text-base-content mb-2 text-sm">
          Review and validate your Safe account setup. (UI to be implemented)
        </p>
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
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
