"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Chain } from "wagmi/chains";
import { WAGMI_CONFIG_NETWORKS_KEY } from "../utils/constants";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";
import {
  RainbowKitProvider,
  lightTheme,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia, anvil } from "wagmi/chains";

export interface WagmiConfigContextType {
  configChains: Chain[];
  setConfigChains: React.Dispatch<React.SetStateAction<Chain[]>>;
  wagmiConfig: ReturnType<typeof getDefaultConfig>;
}

const WagmiConfigContext = createContext<WagmiConfigContextType | undefined>(
  undefined,
);

export const WagmiConfigProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [configChains, setConfigChains] = useState<Chain[]>([
    mainnet,
    sepolia,
    anvil,
  ]);

  // Load chains from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(WAGMI_CONFIG_NETWORKS_KEY);
      if (stored) {
        try {
          setConfigChains(JSON.parse(stored));
        } catch {
          setConfigChains([mainnet, sepolia, anvil]);
        }
      }
    }
  }, []);

  // Save chains to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        WAGMI_CONFIG_NETWORKS_KEY,
        JSON.stringify(configChains),
      );
    }
  }, [configChains]);

  // Compute wagmi config from chains
  const wagmiConfig = useMemo(
    () =>
      getDefaultConfig({
        appName: "MSIG UI",
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
        chains: configChains as [typeof mainnet, ...[typeof mainnet]],
        ssr: false,
      }),
    [configChains],
  );
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiConfigContext.Provider
      value={{ configChains, setConfigChains, wagmiConfig }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={{
              lightMode: lightTheme({
                accentColor: "#605dff",
                accentColorForeground: "white",
              }),
              darkMode: darkTheme({
                accentColor: "#605dff",
                accentColorForeground: "white",
              }),
            }}
          >
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </WagmiConfigContext.Provider>
  );
};

export function useWagmiConfigContext() {
  const ctx = useContext(WagmiConfigContext);
  if (!ctx)
    throw new Error(
      "useWagmiConfigContext must be used within a WagmiConfigProvider",
    );
  return ctx;
}
