"use client";

import AppAddress from "@/app/components/AppAddress";
import AppCard from "@/app/components/AppCard";
import AppSection from "@/app/components/AppSection";
import useSafe from "@/app/hooks/useSafe";
import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount, useSwitchChain } from "wagmi";

export default function SafeDashboardClient({
  safeAddress,
}: {
  safeAddress: `0x${string}`;
}) {
  const {
    safeInfo,
    isLoading,
    error,
    isOwner,
    readOnly,
    buildTransaction,
    signTransaction,
    broadcastTransaction,
  } = useSafe(safeAddress);

  const params = useParams();
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();

  // Sync chain with URL param on mount
  useEffect(() => {
    const urlChainId = params?.chainId ? Number(params.chainId) : undefined;
    if (urlChainId && chain && chain.id !== urlChainId) {
      switchChain?.({ chainId: urlChainId });
    }
  }, [params?.chainId, chain, switchChain]);

  // Example: Dummy tx data for demonstration
  const dummyTx = {
    to: safeAddress,
    value: BigInt(0),
    data: "0x" as `0x${string}`,
  };

  // Handlers for actions (replace with real logic)
  const handleBuildTx = async () => {
    try {
      await buildTransaction(dummyTx);
      // Show modal or toast for success
    } catch {
      // Show error
    }
  };
  const handleSignTx = async () => {
    try {
      await signTransaction({});
    } catch {}
  };
  const handleBroadcastTx = async () => {
    try {
      await broadcastTransaction({});
    } catch {}
  };

  // Show loading spinner if loading
  if (isLoading) {
    return (
      <AppSection>
        <div className="flex h-40 items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </AppSection>
    );
  }

  if (error) {
    return (
      <AppSection>
        <AppCard title="Safe Error">
          <div className="alert alert-error">{error}</div>
        </AppCard>
      </AppSection>
    );
  }

  if (safeInfo && !safeInfo.deployed) {
    return (
      <AppSection>
        <AppCard title="Safe Not Deployed">
          <div className="alert alert-warning mb-4">
            This Safe is not deployed yet. You can deploy it now to start using
            multi-signature features.
          </div>
          {isOwner ? (
            <button className="btn btn-primary w-full">Deploy Safe</button>
          ) : (
            <div className="alert alert-info">
              Read-only: Only owners can deploy.
            </div>
          )}
        </AppCard>
      </AppSection>
    );
  }

  // Only show redirect if shouldRedirect is true and not autoConnected

  // Dashboard layout with DaisyUI stat row, cards, and divider
  return (
    <AppSection>
      {/* Stat row for key Safe data */}
      <div className="stats stats-horizontal mb-6">
        <div className="stat">
          <div className="stat-title">Balance</div>
          <div className="stat-value text-primary">
            {safeInfo?.balance?.toString() ?? "-"}
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">Threshold</div>
          <div className="stat-value">{safeInfo?.threshold ?? "-"}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Owners</div>
          <div className="stat-value">{safeInfo?.owners?.length ?? "-"}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Version</div>
          <div className="stat-value">{safeInfo?.version ?? "-"}</div>
        </div>
      </div>
      <div className="divider">Safe Details</div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AppCard title="Safe Info">
          <div className="mb-2">
            <span className="font-semibold">Address:</span>
            <AppAddress address={safeAddress} className="ml-2" />
          </div>
          {/* Chain selector moved to top right */}
          <div className="mb-2">
            <span className="font-semibold">Owners:</span>
            <ul className="ml-6 list-disc">
              {safeInfo?.owners?.map((owner) => (
                <li key={owner}>
                  <AppAddress address={owner} className="text-xs" />
                </li>
              ))}
            </ul>
          </div>
        </AppCard>
        <AppCard title="Actions">
          <div className="flex flex-col gap-2">
            {readOnly ? (
              <div className="alert alert-info">
                Read-only: Only owners can perform actions.
              </div>
            ) : (
              <>
                <button
                  className="btn btn-outline btn-primary"
                  onClick={handleBuildTx}
                >
                  Build Transaction
                </button>
                <button
                  className="btn btn-outline btn-secondary"
                  onClick={handleSignTx}
                >
                  Sign Transaction
                </button>
                <button
                  className="btn btn-outline btn-success"
                  onClick={handleBroadcastTx}
                >
                  Broadcast Transaction
                </button>
              </>
            )}
          </div>
        </AppCard>
      </div>
    </AppSection>
  );
}
