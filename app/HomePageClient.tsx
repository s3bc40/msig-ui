"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import AppSection from "@/app/components/AppSection";
import AppCard from "@/app/components/AppCard";

export default function HomePageClient() {
  const { isConnected, address } = useAccount();

  return (
    <AppSection className="max-w-2xl self-center">
      <AppCard>
        <h2 className="mb-4 text-center text-4xl font-bold">
          Welcome to MSIG UI
        </h2>
        <p className="mb-8 text-center text-xl">
          Your local safe wallet app to manage safe accounts. Connect your
          wallet to get started.
        </p>
        <div className="flex w-full flex-col items-center gap-6">
          {isConnected ? (
            <Link
              href="/new-safe"
              className="btn btn-primary btn-soft w-full rounded py-4 text-lg"
            >
              Continue with {address?.slice(0, 6) + "..." + address?.slice(-4)}
            </Link>
          ) : (
            <ConnectButton chainStatus={"none"} showBalance={false} />
          )}
        </div>
      </AppCard>
    </AppSection>
  );
}
