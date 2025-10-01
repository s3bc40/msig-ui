"use client";

import Link from "next/link";
import { useState } from "react";
import NetworkModal from "./NetworkModal";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export default function NavBar() {
  const { isConnected } = useAccount();
  const [networkModalOpen, setNetworkModalOpen] = useState(false);
  const handleOpenNetworkModal = () => setNetworkModalOpen(true);
  const handleCloseNetworkModal = () => setNetworkModalOpen(false);

  return (
    <nav className="navbar bg-base-200 border-base-100 sticky top-0 z-20 w-full justify-between border-b">
      <div className="flex items-center">
        <Link
          className="mx-2 px-2 text-sm font-bold sm:text-xl"
          href="/accounts"
        >
          MSIG UI
        </Link>
      </div>
      <div className="flex items-center">
        <label className="swap swap-rotate">
          <input type="checkbox" className="theme-controller" value="light" />
          {/* Sun */}
          <svg
            className="swap-on h-5 w-5 fill-current sm:h-7 sm:w-7"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
          </svg>
          {/* Moon */}
          <svg
            className="swap-off h-5 w-5 fill-current sm:h-7 sm:w-7"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
          </svg>
        </label>
        <div className="divider divider-horizontal"></div>
        {isConnected && (
          <>
            {/* Manage Network button */}
            <button
              className="btn btn-primary sm:btn-sm btn-xs btn-circle"
              onClick={handleOpenNetworkModal}
              title="Manage Networks"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 sm:h-6 sm:w-6"
              >
                {/* General network/chain icon: interconnected nodes */}
                <circle cx="5" cy="12" r="3" />
                <circle cx="19" cy="12" r="3" />
                <circle cx="12" cy="5" r="3" />
                <circle cx="12" cy="19" r="3" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="11" y2="12" />
                <line x1="13" y1="12" x2="16" y2="12" />
              </svg>
            </button>
            <div className="divider divider-horizontal"></div>
          </>
        )}
        <ConnectButton
          accountStatus={{
            smallScreen: "avatar",
            largeScreen: "full",
          }}
          showBalance={{
            smallScreen: false,
            largeScreen: true,
          }}
        />
        <NetworkModal
          open={networkModalOpen}
          onClose={handleCloseNetworkModal}
        />
      </div>
    </nav>
  );
}
