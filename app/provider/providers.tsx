import { SafeWalletProvider } from "./SafeWalletProvider";
import { SafeTxProvider } from "./SafeTxProvider";
import { WagmiConfigProvider } from "./WagmiConfigProvider";
import { State } from "wagmi";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
  initialState?: State;
}) {
  return (
    <WagmiConfigProvider>
      <SafeWalletProvider>
        <SafeTxProvider>{children}</SafeTxProvider>
      </SafeWalletProvider>
    </WagmiConfigProvider>
  );
}
