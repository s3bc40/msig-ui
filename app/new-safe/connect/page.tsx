"use client";

import { useState } from "react";
import AppSection from "@/app/components/AppSection";
import AppCard from "@/app/components/AppCard";
import AppAddress from "@/app/components/AppAddress";
import BtnBackHistory from "@/app/components/BtnBackHistory";
import { useSafe } from "@/app/provider/SafeProvider";
import { useAccount } from "wagmi";

export default function ConnectSafeClient() {
  const { chain } = useAccount();
  const [safeAddress, setSafeAddress] = useState("");

  const { connectSafe, isConnecting, connectError, isDeployed } = useSafe();

  async function handleConnect() {
    if (!chain) {
      alert("Please connect your wallet to a network first.");
      return;
    }
    await connectSafe(chain, safeAddress as `0x${string}`);
  }

  function isValidSafeAddress() {
    return /^0x[a-fA-F0-9]{40}$/.test(safeAddress);
  }

  return (
    <AppSection>
      <div>
        <BtnBackHistory />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center">
        <AppCard title="Connect to Safe">
          <p className="text-base-content mb-4">
            Enter your Safe address to connect and manage your multi-signature
            wallet.
          </p>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              className="input input-bordered validator font-mono"
              placeholder="0x..."
              value={safeAddress}
              pattern="^0x[a-fA-F0-9]{40}$"
              onChange={(e) => setSafeAddress(e.target.value)}
              disabled={isConnecting}
              required
            />
            <div className="validator-hint">Invalid address format</div>
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={handleConnect}
              disabled={isConnecting || !isValidSafeAddress()}
            >
              {isConnecting ? "Connecting..." : "Connect Safe"}
            </button>
            {isDeployed === true && (
              <div className="alert alert-success mt-2">
                Safe is deployed and ready!
              </div>
            )}
            {isDeployed === false && (
              <div className="alert alert-error mt-2">
                This address is not a deployed Safe.
              </div>
            )}
            {connectError && (
              <div className="alert alert-error mt-2">{connectError}</div>
            )}
          </div>
        </AppCard>
      </div>
    </AppSection>
  );
}
