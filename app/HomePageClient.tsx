"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export default function HomePageClient() {
  const { isConnected, address } = useAccount();

  return (
    <div className="container mx-auto max-w-2xl self-center shadow-2xl">
      <div className="bg-base-100 flex flex-col items-center justify-center gap-6 rounded p-10">
        <h2 className="text-4xl font-bold">MSIG UI</h2>
        <p className="text-xl">
          Your local safe wallet app to manage safe accounts.
        </p>
        <p className="text-lg">Connect your wallet to get started.</p>
        {isConnected ? (
          <Link href="/new-safe" className="btn btn-primary btn-soft rounded">
            Continue with {address?.slice(0, 6) + "..." + address?.slice(-4)}
          </Link>
        ) : (
          <ConnectButton chainStatus={"none"} showBalance={false} />
        )}
      </div>
    </div>
  );
}
