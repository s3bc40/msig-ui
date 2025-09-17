// Types for SafeProvider helpers
import { ContractNetworks } from "./contractNetworks";

type SafeStep = {
  status: "idle" | "running" | "success" | "error";
  error?: string;
};

export type SafeConnectStep = {
  step: "pending" | "connecting" | "connected";
} & SafeStep;

export type SafeDeployStep = {
  step: "txCreated" | "txSent" | "confirmed" | "deployed";
  txHash?: string;
} & SafeStep;

export type MinimalEIP1193Provider = {
  request: (args: unknown) => Promise<unknown>;
  on?: (...args: unknown[]) => void;
  removeListener?: (...args: unknown[]) => void;
};

// SafeConfig union type
export type SafeConfigPrediction = {
  provider: MinimalEIP1193Provider | string;
  signer: string | undefined;
  predictedSafe: {
    safeAccountConfig: { owners: `0x${string}`[]; threshold: number };
    safeDeploymentConfig?: { saltNonce: string };
  };
  contractNetworks?: ContractNetworks;
};

export type SafeConfigConnection = {
  provider: MinimalEIP1193Provider;
  signer: string | undefined;
  safeAddress: `0x${string}`;
  contractNetworks?: ContractNetworks;
};

export type SafeConfig = SafeConfigPrediction | SafeConfigConnection;

// --- SafeWallet Counterfactual Types ---
// safe-global/safe-wallet-monorepo/packages/store/src/gateway/types.ts
export enum PayMethod {
  PayNow = "PayNow",
  PayLater = "PayLater",
}

export enum PendingSafeStatus {
  AWAITING_EXECUTION = "AWAITING_EXECUTION",
  PROCESSING = "PROCESSING",
  RELAYING = "RELAYING",
}

export type UndeployedSafeStatus = {
  status: PendingSafeStatus;
  type: PayMethod;
  txHash?: string;
  taskId?: string;
  startBlock?: number;
  submittedAt?: number;
  signerAddress?: string;
  signerNonce?: number | null;
};

export type ReplayedSafeProps = {
  factoryAddress: string;
  masterCopy: string;
  safeAccountConfig: {
    threshold: number;
    owners: `0x${string}`[];
    fallbackHandler?: string;
    to?: string;
    data?: string;
    paymentToken?: string;
    payment?: number;
    paymentReceiver?: string;
  };
  saltNonce: string;
  safeVersion: string;
};

export type UndeployedSafe = {
  status: UndeployedSafeStatus;
  props: ReplayedSafeProps;
};

// SafeWalletData structure for localStorage
export interface SafeWalletData {
  version: string;
  data: {
    addressBook: {
      [chainId: string]: {
        [safeAddress: string]: string;
      };
    };
    addedSafes: {
      [chainId: string]: {
        [safeAddress: string]: {
          owners: string[];
          threshold: number;
        };
      };
    };
    undeployedSafes: {
      [chainId: string]: {
        [safeAddress: string]: UndeployedSafe;
      };
    };
    visitedSafes?: {
      [chainId: string]: { [safeAddress: string]: { lastVisited: number } };
    };
  };
}
