"use client";

import AppAddress from "@/app/components/AppAddress";
import AppCard from "@/app/components/AppCard";
import AppSection from "@/app/components/AppSection";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { useSafeContext } from "@/app/provider/SafeProvider";
import { useRouter } from "next/navigation";
import useSafe from "@/app/hooks/useSafe";

interface SafeInfoClientProps {
  safeAddress: `0x${string}`;
}

export default function SafeInfoClient({ safeAddress }: SafeInfoClientProps) {
  const router = useRouter();
  const { address: signer, chain } = useAccount();
  const { isConnecting } = useSafeContext();
  const {
    safeInfo,
    isDeployed,
    isLoading,
    error,
    connectSafe,
    buildTransaction,
    signTransaction,
    broadcastTransaction,
  } = useSafe(safeAddress);

  const [autoConnected, setAutoConnected] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Auto-connect logic: runs on mount or when safeAddress or chain changes
  useEffect(() => {
    if (safeAddress && chain) {
      connectSafe()
        .then(() => setAutoConnected(true))
        .catch(() => setAutoConnected(false));
      setShouldRedirect(false);
    } else if (safeAddress) {
      setShouldRedirect(true);
    }
    // Only run on safeAddress or chain change
  }, [safeAddress, chain, connectSafe]);

  // Example: Dummy tx data for demonstration
  const dummyTx = {
    to: safeAddress,
    value: BigInt(0),
    data: "0x",
  };

  // Handlers for actions (replace with real logic)
  const handleBuildTx = async () => {
    try {
      await buildTransaction(dummyTx);
      // Show modal or toast for success
    } catch (e) {
      // Show error
    }
  };
  const handleSignTx = async () => {
    try {
      await signTransaction({});
    } catch (e) {}
  };
  const handleBroadcastTx = async () => {
    try {
      await broadcastTransaction({});
    } catch (e) {}
  };

  // Show loading spinner if connecting or loading
  if (isConnecting || isLoading) {
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

  if (isDeployed === false) {
    return (
      <AppSection>
        <AppCard title="Safe Not Deployed">
          <div className="alert alert-warning mb-4">
            This Safe is not deployed yet. You can deploy it now to start using
            multi-signature features.
          </div>
          <button className="btn btn-primary w-full">Deploy Safe</button>
        </AppCard>
      </AppSection>
    );
  }

  if (isConnecting) {
    return (
      <AppSection>
        <div className="flex h-40 items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </AppSection>
    );
  }

  // Only show redirect if not connecting and shouldRedirect is true
  if (shouldRedirect && !isConnecting && !autoConnected) {
    return (
      <AppSection>
        <AppCard title="Safe Not Connected">
          <div className="alert alert-warning mb-4">
            This Safe is not connected. Please connect to your Safe first.
          </div>
          <button
            className="btn btn-primary w-full"
            onClick={() => router.push("/new-safe/connect")}
          >
            Go to Connect Page
          </button>
        </AppCard>
      </AppSection>
    );
  }

  // Show Safe details and actions if deployed
  return (
    <AppSection>
      <AppCard title="Safe Details">
        <div className="mb-2">
          <span className="font-semibold">Address:</span>
          <AppAddress address={safeAddress} className="ml-2" />
        </div>
        {chain && (
          <div className="mb-2">
            <span className="font-semibold">Chain:</span> {chain.name}
          </div>
        )}
        <div className="mb-2">
          <span className="font-semibold">Balance:</span>{" "}
          {safeInfo?.balance?.toString() ?? "-"}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Contract Version:</span>{" "}
          {safeInfo?.version ?? "-"}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Threshold:</span>{" "}
          {safeInfo?.threshold ?? "-"}
        </div>
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
        <div className="divider"></div>
        <div className="flex flex-col gap-2">
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
        </div>
      </AppCard>
    </AppSection>
  );
}
