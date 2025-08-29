"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import {
  RainbowKitProvider,
  lightTheme,
  darkTheme,
  cssStringFromTheme,
} from "@rainbow-me/rainbowkit";
import { config } from "./config";

type Props = {
  children: React.ReactNode;
};

const queryClient = new QueryClient();

console.log(
  cssStringFromTheme(
    lightTheme({
      accentColor: "#fdc700",
      accentColorForeground: "black",
    }),
  ),
);

console.log(
  cssStringFromTheme(
    darkTheme({
      accentColor: "#ff865b",
      accentColorForeground: "black",
    }),
  ),
);

export function Providers({ children }: Props) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={{
            lightMode: lightTheme({
              accentColor: "#fdc700",
              accentColorForeground: "black",
            }),
            darkMode: darkTheme({
              accentColor: "#ff865b",
              accentColorForeground: "black",
            }),
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
