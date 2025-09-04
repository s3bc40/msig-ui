// Address validation helper
export function isValidAddress(address: string): address is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Compare prediction params
export function havePredictionParamsChanged(
  prev: { network: unknown; signers: string[]; threshold: number },
  next: { network: unknown; signers: string[]; threshold: number },
): boolean {
  return (
    prev.network !== next.network ||
    prev.signers.join(",") !== next.signers.join(",") ||
    prev.threshold !== next.threshold
  );
}
