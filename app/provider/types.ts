// Types for SafeProvider helpers

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
