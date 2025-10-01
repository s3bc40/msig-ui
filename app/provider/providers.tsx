"use client";

import { SafeWalletProvider } from "./SafeWalletProvider";
import { SafeTxProvider } from "./SafeTxProvider";
import { WagmiConfigProvider } from "./WagmiConfigProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfigProvider>
      <SafeWalletProvider>
        <SafeTxProvider>{children}</SafeTxProvider>
      </SafeWalletProvider>
    </WagmiConfigProvider>
  );
}
