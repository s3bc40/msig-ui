// Types for SafeProvider helpers

export type SafeDeployStep = {
  step: "txCreated" | "txSent" | "confirmed" | "deployed";
  status: "idle" | "running" | "success" | "error";
  txHash?: string;
  error?: string;
};

export type MinimalEIP1193Provider = {
  request: (args: unknown) => Promise<unknown>;
  on?: (...args: unknown[]) => void;
  removeListener?: (...args: unknown[]) => void;
};
