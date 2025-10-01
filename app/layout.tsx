import type { Metadata } from "next";
import "./globals.css";
import Providers from "./provider/providers";
import NavBar from "./components/NavBar";

export const metadata: Metadata = {
  title: "MSIG UI",
  description: "Multi-Signature Wallet Interface",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="min-h-screen">
      <body className={`bg-base-300 min-h-screen antialiased`}>
        <Providers>
          <NavBar />
          <main className="flex flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
