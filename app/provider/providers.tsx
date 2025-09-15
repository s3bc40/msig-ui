"use client";

import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import {
  RainbowKitProvider,
  lightTheme,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { config } from "../config";
import { SafeWalletProvider } from "./SafeWalletProvider";
import type { State } from "wagmi";
import { SafeKitProvider } from "./SafeKitProvider";

// From https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function Providers({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: State | undefined;
}) {
  const queryClient = getQueryClient();

  return (
    <WagmiProvider initialState={initialState} config={config}>
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
          <SafeWalletProvider>
            <SafeKitProvider>{children}</SafeKitProvider>
          </SafeWalletProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
