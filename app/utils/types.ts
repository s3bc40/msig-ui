// Types for SafeProvider helpers

import { localContractNetworks } from "./localContractNetworks";

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
  provider: MinimalEIP1193Provider;
  signer: string | undefined;
  predictedSafe: {
    safeAccountConfig: { owners: `0x${string}`[]; threshold: number };
    safeDeploymentConfig?: { saltNonce: string };
  };
  contractNetworks?: typeof localContractNetworks;
};

export type SafeConfigConnection = {
  provider: MinimalEIP1193Provider;
  signer: string | undefined;
  safeAddress: `0x${string}`;
  contractNetworks?: typeof localContractNetworks;
};

export type SafeConfig = SafeConfigPrediction | SafeConfigConnection;

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
        [safeAddress: string]: SafeConfigData;
      };
    };
    visitedSafes?: {
      [chainId: string]: { [safeAddress: string]: { lastVisited: number } };
    };
  };
}

export interface SafeConfigData {
  props: {
    factoryAddress: string;
    masterCopy: string;
    safeAccountConfig: {
      owners: string[];
      threshold: number;
      fallbackHandler?: string;
      to?: string;
      data?: string;
      paymentReceiver?: string;
      safeVersion?: string;
    };
    saltNonce: string;
    safeVersion: string;
  };
  status: { status: string; type: string };
  startBlock?: number;
  submittedAt?: number;
}
