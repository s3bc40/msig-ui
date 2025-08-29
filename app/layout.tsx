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
      <body
        className={`${roboto.variable} ${robotoMono.variable} bg-base-300 antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen flex-col">
            {/* Navbar */}
            <nav className="navbar bg-base-100 border-base-300 sticky top-0 z-20 w-full border-b">
              <div className="flex-none md:hidden">
                <label
                  htmlFor="sidebar-drawer"
                  aria-label="open sidebar"
                  className="btn btn-square btn-ghost"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="inline-block h-6 w-6 stroke-current"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    ></path>
                  </svg>
                </label>
              </div>
              <div className="mx-2 flex-1 px-2 text-xl font-bold">MSIG UI</div>
              <div className="flex-none">
                <ConnectButton />
              </div>
            </nav>
            <div className="drawer md:drawer-open border-base-300 border-x">
              <input
                id="sidebar-drawer"
                type="checkbox"
                className="drawer-toggle"
              />
              <div className="drawer-content flex flex-col">
                {/* Main content */}
                <main className="mx-auto w-full flex-1 px-4 py-6">
                  {children}
                </main>
              </div>
              <div className="drawer-side border-base-300 top-16 border-r">
                <label
                  htmlFor="sidebar-drawer"
                  aria-label="close sidebar"
                  className="drawer-overlay"
                ></label>
                <ul className="menu bg-base-100 text-base-content min-h-full w-64 p-4">
                  <li>
                    <Link href="/">Home</Link>
                  </li>
                  {/* Add more sidebar links here */}
                </ul>
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
