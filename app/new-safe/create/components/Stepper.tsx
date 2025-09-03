import React from "react";

interface StepperProps {
  steps: string[];
  currentStep: number;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => (
  <ul className="steps col-span-4">
    {steps.map((label, idx) => (
      <li
        key={label}
        className={
          "text-base-content step text-sm" +
          (idx < currentStep
            ? " step-primary"
            : idx === currentStep
              ? " step-primary"
              : "")
        }
      >
        {label}
      </li>
    ))}
  </ul>
);

export default Stepper;
