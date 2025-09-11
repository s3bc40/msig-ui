"use client";

import AppSection from "@/app/components/AppSection";
import AppCard from "@/app/components/AppCard";
import BtnCancel from "@/app/components/BtnCancel";
import { useState, useEffect } from "react";
import { WorkflowModal } from "@/app/components/WorkflowModal";
import { useAccount, useChains } from "wagmi";
import { STEPS_CONNECT_LABEL } from "../constants";
import { useRouter } from "next/navigation";
import { useSafeWalletContext } from "@/app/provider/SafeWalletProvider";
import useNewSafe from "@/app/hooks/useNewSafe";
import { SafeConnectStep } from "@/app/utils/types";

export default function ConnectSafeClient() {
  const { chain } = useAccount();
  const chains = useChains();
  const { safeWalletData } = useSafeWalletContext();
  const { connectNewSafe } = useNewSafe();
  const router = useRouter();

  // Single chain selection for connection
  const [selectedChain, setSelectedChain] = useState<string>("");

  // Local UI state for connection feedback
  const [safeAddress, setSafeAddress] = useState<`0x${string}`>();
  const [modalOpen, setModalOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSteps, setConnectSteps] = useState<SafeConnectStep[]>([]);

  // Autofill safeAddress from localStorage if present
  useEffect(() => {
    const stored = localStorage.getItem("safeAddress");
    if (stored && /^0x[a-fA-F0-9]{40}$/.test(stored)) {
      setSafeAddress(stored as `0x${string}`);
    }
  }, []);

  // ...rest of the component logic and return statement...

  // Check if the Safe is deployed on the selected chain using SafeWalletData
  const [isDeployed, setIsDeployed] = useState<boolean | null>(null);
  useEffect(() => {
    if (!safeAddress || !selectedChain) {
      setIsDeployed(null);
      return;
    }
    const isAdded =
      safeWalletData.data.addedSafes[selectedChain]?.[safeAddress];
    setIsDeployed(!!isAdded);
  }, [safeAddress, selectedChain, safeWalletData]);

  async function handleConnect() {
    if (!selectedChain) {
      alert("Please select a network.");
      return;
    }
    setModalOpen(true);
    setIsConnecting(true);
    setConnectError(null);
    setConnectSteps([
      { step: "pending", status: "running" },
      { step: "connecting", status: "idle" },
      { step: "connected", status: "idle" },
    ]);
    try {
      // Pass selectedChain to connectNewSafe
      await connectNewSafe(safeAddress as `0x${string}`, selectedChain);
      setConnectSteps([
        { step: "pending", status: "success" },
        { step: "connecting", status: "success" },
        { step: "connected", status: "success" },
      ]);
    } catch {
      setConnectError("Failed to connect to Safe");
      setConnectSteps([
        { step: "pending", status: "error" },
        { step: "connecting", status: "idle" },
        { step: "connected", status: "idle" },
      ]);
    } finally {
      setIsConnecting(false);
    }
  }

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
            Enter your Safe address and select networks to connect and manage
            your multi-signature wallet.
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block font-semibold">Safe Address:</label>
              <input
                type="text"
                className="input input-bordered validator font-mono"
                placeholder="0x..."
                value={safeAddress}
                pattern="^0x[a-fA-F0-9]{40}$"
                onChange={(e) =>
                  setSafeAddress(e.target.value as `0x${string}`)
                }
                disabled={isConnecting}
                required
              />
              <div className="validator-hint">Invalid address format</div>
            </div>
            <div>
              <label className="mb-2 block font-semibold">
                Select Network:
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                disabled={isConnecting}
                required
              >
                <option value="" disabled>
                  Choose a network
                </option>
                {chains.map((chain) => (
                  <option key={chain.id} value={chain.id.toString()}>
                    {chain.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedChain && (
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-secondary badge-outline">
                  {chains.find((c) => c.id.toString() === selectedChain)
                    ?.name || selectedChain}
                </span>
              </div>
            )}
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
          (isDeployed === false
            ? "This address is not a deployed Safe on the selected network."
            : null)
        }
        selectedNetwork={chains.find((c) => c.id.toString() === selectedChain)}
        onClose={handleCloseModal}
        onGoToSafe={handleGoToSafe}
        showGoToSafe={isDeployed === true && !connectError}
        goToSafeLabel={redirecting ? "Redirecting..." : "Go to Safe"}
        closeLabel="Close"
      />
    </AppSection>
  );
}
