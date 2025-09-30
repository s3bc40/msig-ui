"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http, cookieStorage, createStorage } from "wagmi";
import {
  sepolia,
  optimismSepolia,
  arbitrumSepolia,
  baseSepolia,
  avalancheFuji,
  celoSepolia,
  scrollSepolia,
  zksyncSepoliaTestnet,
  polygonAmoy,
  lineaSepolia,
  anvil,
} from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "MSIG UI",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [
    sepolia,
    optimismSepolia,
    arbitrumSepolia,
    baseSepolia,
    celoSepolia,
    scrollSepolia,
    zksyncSepoliaTestnet,
    polygonAmoy,
    avalancheFuji,
    anvil,
  ],
  transports: {
    // Testnets RPC URL
    [anvil.id]: http(),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL!),
    [optimismSepolia.id]: http(process.env.NEXT_PUBLIC_OP_SEPOLIA_RPC_URL!),
    [arbitrumSepolia.id]: http(process.env.NEXT_PUBLIC_ARB_SEPOLIA_RPC_URL!),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL!),
    [zksyncSepoliaTestnet.id]: http(
      process.env.NEXT_PUBLIC_ZKSYNC_SEPOLIA_RPC_URL!,
    ),
    [celoSepolia.id]: http(process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC_URL!),
    [scrollSepolia.id]: http(process.env.NEXT_PUBLIC_SCROLL_SEPOLIA_RPC_URL!),
    [lineaSepolia.id]: http(process.env.NEXT_PUBLIC_LINEA_SEPOLIA_RPC_URL!),
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL!),
    [avalancheFuji.id]: http(process.env.NEXT_PUBLIC_AVAX_FUJI_RPC_URL!),
    // Mainnet RPC URL
    // TODO: allow when sure about the app
    // [mainnet.id]: http(),
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
