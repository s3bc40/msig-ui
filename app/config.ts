"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { Config, http } from "wagmi";
import { mainnet, anvil, sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "My RainbowKit App",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [mainnet, sepolia, anvil],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [anvil.id]: http(),
  },
  ssr: true,
}) as Config;
