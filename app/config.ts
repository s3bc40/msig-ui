import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { cookieStorage, createStorage } from "wagmi";
import { anvil, mainnet, sepolia } from "wagmi/chains";

/**
 * Create a wagmi config with default chains and cookie storage
 *
 * This is used for server-side rendering and as a base config
 * The actual config used in the app is created in WagmiConfigProvider
 * and can be customized with additional chains
 *
 * @returns Config object for wagmi
 */
export function getConfig() {
  return getDefaultConfig({
    appName: "MSIG UI",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    chains: [mainnet, sepolia, anvil],
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
    }),
  });
}
