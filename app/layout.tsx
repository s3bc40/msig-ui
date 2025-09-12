import type { Metadata } from "next";
import "./globals.css";
import Providers from "./provider/providers";
import NavBar from "./components/NavBar";
import LoadingOverlay from "./components/LoadingOverlay";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { config } from "./config";

export const metadata: Metadata = {
  title: "MSIG UI",
  description: "Multi-Signature Wallet Interface",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialState = cookieToInitialState(
    config,
    (await headers()).get("cookie"),
  );
  return (
    <html lang="en" className="min-h-screen">
      <body className={`bg-base-300 min-h-screen antialiased`}>
        <Providers initialState={initialState}>
          <LoadingOverlay />
          <NavBar />
          <main className="flex flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
