"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Chain } from "wagmi/chains";
import { WAGMI_CONFIG_NETWORKS_KEY } from "../utils/constants";
import { State, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  lightTheme,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { config } from "../config";

export interface WagmiConfigContextType {
  configChains: Chain[];
  addChain: (chain: Chain) => void;
  removeChain: (chain: Chain) => void;
}

const WagmiConfigContext = createContext<WagmiConfigContextType | undefined>(
  undefined,
);

export const WagmiConfigProvider: React.FC<{
  children: React.ReactNode;
  initialState?: State;
}> = ({ children, initialState }) => {
  const [configChains, setConfigChains] = useState<Chain[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(WAGMI_CONFIG_NETWORKS_KEY);
      if (stored) {
        try {
          setConfigChains(JSON.parse(stored));
        } catch {
          setConfigChains([]);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        WAGMI_CONFIG_NETWORKS_KEY,
        JSON.stringify(configChains),
      );
    }
  }, [configChains]);

  const addChain = (chain: Chain) => {
    setConfigChains((prev) => {
      if (prev.some((c) => c.id === chain.id)) return prev;
      return [...prev, chain];
    });
  };

  const removeChain = (chain: Chain) => {
    setConfigChains((prev) => prev.filter((c) => c.id !== chain.id));
  };

  // // Helper to merge config and custom chains
  // function getMergedConfig(baseConfig: typeof config, customChains: Chain[]) {
  //   const chainMap = new Map<number, Chain>();
  //   [...baseConfig.chains, ...customChains].forEach((chain) => {
  //     chainMap.set(chain.id, chain);
  //   });
  //   const mergedChains = Array.from(chainMap.values());
  //   return {
  //     ...baseConfig,
  //     chains:
  //       mergedChains.length > 0
  //         ? (mergedChains as [Chain, ...Chain[]])
  //         : (baseConfig.chains as [Chain, ...Chain[]]),
  //   };
  // }

  // const wagmiConfig = getMergedConfig(config, configChains);

  // console.log("WagmiConfigProvider configChains:", config);
  // console.log("WagmiConfigProvider wagmiConfig:", wagmiConfig);

  // From https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
  // function makeQueryClient() {
  //   return new QueryClient({
  //     defaultOptions: {
  //       queries: {
  //         // With SSR, we usually want to set some default staleTime
  //         // above 0 to avoid refetching immediately on the client
  //         staleTime: 60 * 1000,
  //       },
  //     },
  //   });
  // }

  // let browserQueryClient: QueryClient | undefined = undefined;

  // function getQueryClient() {
  //   if (isServer) {
  //     // Server: always make a new query client
  //     return makeQueryClient();
  //   } else {
  //     // Browser: make a new query client if we don't already have one
  //     // This is very important, so we don't re-make a new client if React
  //     // suspends during the initial render. This may not be needed if we
  //     // have a suspense boundary BELOW the creation of the query client
  //     if (!browserQueryClient) browserQueryClient = makeQueryClient();
  //     return browserQueryClient;
  //   }
  // }

  // Create a single QueryClient instance
  const queryClient = new QueryClient();

  return (
    <WagmiConfigContext.Provider
      value={{ configChains, addChain, removeChain }}
    >
      <WagmiProvider config={config} initialState={initialState}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={{
              lightMode: lightTheme({
                accentColor: "#422ad5",
                accentColorForeground: "white",
              }),
              darkMode: darkTheme({
                accentColor: "#422ad5",
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
