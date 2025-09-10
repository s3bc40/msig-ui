"use client";

import AppSection from "@/app/components/AppSection";
import AppCard from "@/app/components/AppCard";
import BtnCancel from "@/app/components/BtnCancel";
import { useState, useEffect, useRef } from "react";
import { WorkflowModal } from "@/app/components/WorkflowModal";
import { useAccount, useChains } from "wagmi";
import { STEPS_CONNECT_LABEL } from "../constants";
import { useRouter } from "next/navigation";
import { useSafeContext } from "@/app/hooks/useSafeContext";
import { useSafeAccount } from "@/app/hooks/useSafeAccount";

export default function ConnectSafeClient() {
  const chains = useChains();
  const { chain } = useAccount();
  const [selectedNetwork, setSelectedNetwork] = useState(chain);
  const userSelectedNetwork = useRef(false);
  const [safeAddress, setSafeAddress] = useState("");

  // Autofill safeAddress from localStorage if present
  useEffect(() => {
    const stored = localStorage.getItem("safeAddress");
    if (stored && /^0x[a-fA-F0-9]{40}$/.test(stored)) {
      setSafeAddress(stored);
    }
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();

  function handleSelect(id: number) {
    const found = chains.find((c) => c.id === id);
    if (found) {
      setSelectedNetwork(found);
      userSelectedNetwork.current = true;
    }
  }

  // Sync selectedNetwork with wallet network unless user manually selected
  useEffect(() => {
    if (!userSelectedNetwork.current && chain) {
      setSelectedNetwork(chain);
    }
  }, [chain]);

  const { connectSafe, resetSafe, isConnecting, connectError, connectSteps } =
    useSafeContext();

  const { isDeployed } = useSafeAccount();

  async function handleConnect() {
    if (!selectedNetwork || isNetworkMismatch) {
      alert(
        "Please switch your wallet to the selected network before connecting.",
      );
      return;
    }
    // Clear previous state
    resetSafe();
    setModalOpen(true);
    await connectSafe(safeAddress as `0x${string}`);
  }

  function isValidSafeAddress() {
    return /^0x[a-fA-F0-9]{40}$/.test(safeAddress);
  }

  const isNetworkMismatch =
    selectedNetwork && chain && selectedNetwork.id !== chain.id;

  function handleCloseModal() {
    setModalOpen(false);
  }

  function handleGoToSafe() {
    setRedirecting(true);
    router.push(`safe/${safeAddress}`);
  }

  return (
    <AppSection>
      <div>
        <BtnCancel href="/new-safe" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center">
        <AppCard title="Connect to Safe">
          <p className="text-base-content mb-4">
            Enter your Safe address to connect and manage your multi-signature
            wallet.
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block font-semibold">
                Select Network:
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedNetwork?.id ?? ""}
                onChange={(e) => handleSelect(Number(e.target.value))}
                disabled={isConnecting}
              >
                <option value="" disabled>
                  Choose network
                </option>
                {chains.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {isNetworkMismatch && (
              <div className="alert alert-warning">
                Please switch your wallet to <b>{selectedNetwork?.name}</b>
                before connecting.
              </div>
            )}
            <div>
              <label className="mb-2 block font-semibold">Safe Address:</label>
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
            </div>
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={handleConnect}
              disabled={
                isConnecting ||
                !isValidSafeAddress() ||
                !selectedNetwork ||
                isNetworkMismatch
              }
            >
              {isConnecting ? "Connecting..." : "Connect Safe"}
            </button>
          </div>
        </AppCard>
      </div>
      <WorkflowModal
        open={modalOpen}
        steps={connectSteps}
        stepLabels={STEPS_CONNECT_LABEL}
        txHash={null}
        error={
          connectError ||
          (isDeployed === false ? "This address is not a deployed Safe." : null)
        }
        selectedNetwork={selectedNetwork}
        onClose={handleCloseModal}
        onGoToSafe={handleGoToSafe}
        showGoToSafe={isDeployed === true && !connectError}
        goToSafeLabel={redirecting ? "Redirecting..." : "Go to Safe"}
        closeLabel="Close"
      />
    </AppSection>
  );
}
