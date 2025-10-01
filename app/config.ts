"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, anvil, mainnet } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "MSIG UI",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [mainnet, sepolia, anvil],
  ssr: false,
});
