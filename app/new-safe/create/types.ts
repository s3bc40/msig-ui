import { SafeDeployStep } from "@/app/provider/types";
import { Chain } from "viem";

export interface LastPredictionRef {
  network: Chain;
  signers: string[];
  threshold: number;
  address: `0x${string}` | null;
}

export interface StepperProps {
  steps: string[];
  currentStep: number;
}

export interface DeploymentModalProps {
  open: boolean;
  steps: SafeDeployStep[];
  deployTxHash?: string | null;
  deployError?: string | null;
  selectedNetwork?: Chain;
  onClose: () => void;
}
