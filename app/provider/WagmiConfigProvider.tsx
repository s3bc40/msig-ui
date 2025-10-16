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

  const [chainsLoaded, setChainsLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure we're on the client side before initializing
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      } else {
        setConfigChains([mainnet, sepolia, anvil]);
      }
      setChainsLoaded(true);
    }
  }, []);

  // Save chains to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined" && chainsLoaded) {
      localStorage.setItem(
        WAGMI_CONFIG_NETWORKS_KEY,
        JSON.stringify(configChains),
      );
    }
  }, [configChains, chainsLoaded]);

  // Compute wagmi config from chains - only on client side
  const wagmiConfig = useMemo(() => {
    if (!isMounted) return null;

    return getDefaultConfig({
      appName: "MSIG UI",
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
      chains: configChains as [typeof mainnet, ...[typeof mainnet]],
      ssr: false,
    });
  }, [configChains, isMounted]);

  const [queryClient] = useState(() => new QueryClient());

  // Don't render providers until client-side mounted
  if (!isMounted || !wagmiConfig) {
    return null;
  }

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
