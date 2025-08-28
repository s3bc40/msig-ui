import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./provider";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
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
    <html lang="en">
      <body className={`${roboto.variable} ${robotoMono.variable} antialiased`}>
        <Providers>
          {/* DaisyUI Drawer Layout */}
          <div className="drawer min-h-screen">
            <input
              id="sidebar-drawer"
              type="checkbox"
              className="drawer-toggle"
            />
            <div className="drawer-content flex flex-col">
              {/* Navbar */}
              <nav className="navbar bg-base-200 mb-2 shadow">
                <div className="flex-1">
                  <label
                    htmlFor="sidebar-drawer"
                    className="btn btn-ghost lg:hidden"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </label>
                  <a className="btn btn-ghost text-xl">MSIG UI</a>
                </div>
                <div className="flex-none">
                  <ConnectButton />
                </div>
              </nav>
              <main className="mx-auto w-full flex-1 px-4 py-6">
                {children}
              </main>
              {/* Footer */}
              <footer className="footer text-base-content bg-base-200 mt-8 flex flex-row items-center justify-between border-t p-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold">MSIG UI</span>
                  <span>
                    © {new Date().getFullYear()} - All rights reserved
                  </span>
                </div>
                <div className="flex gap-4">
                  <a href="#" className="link link-hover">
                    About
                  </a>
                  <a href="#" className="link link-hover">
                    Contact
                  </a>
                </div>
              </footer>
            </div>
            {/* Drawer sidebar */}
            <div className="drawer-side">
              <label
                htmlFor="sidebar-drawer"
                className="drawer-overlay"
              ></label>
              <ul className="menu bg-base-100 text-base-content h-full w-64 p-4">
                <li>
                  <Link href="/">Home</Link>
                </li>
                {/* Add more sidebar links here */}
              </ul>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
