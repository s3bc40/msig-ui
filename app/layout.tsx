import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./provider";
import Link from "next/link";
import NavBar from "./components/NavBar";
import SideBar from "./components/SideBar";
// DaisyUI Navbar, Footer, and Drawer will be used instead of custom Navbar

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="min-h-screen">
      <body
        className={`min-h-screen ${roboto.variable} ${robotoMono.variable} bg-base-200 antialiased`}
      >
        <Providers>
          <NavBar />
          <main className="flex flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
