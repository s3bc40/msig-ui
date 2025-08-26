"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { Config } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, base } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "My RainbowKit App",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true,
}) as Config;
