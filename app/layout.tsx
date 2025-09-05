import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./provider/providers";
import NavBar from "./components/NavBar";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { config } from "./config";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

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
      <body
        className={`min-h-screen ${roboto.variable} ${robotoMono.variable} bg-base-300 antialiased`}
      >
        <Providers initialState={initialState}>
          <NavBar />
          <main className="flex flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
