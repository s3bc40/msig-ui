"use client";

import AppSection from "@/app/components/AppSection";
import AppCard from "@/app/components/AppCard";
import BtnCancel from "@/app/components/BtnCancel";
import { useState } from "react";
import { useChains } from "wagmi";
import { useRouter } from "next/navigation";
import { useSafeWalletContext } from "@/app/provider/SafeWalletProvider";
import useNewSafe from "@/app/hooks/useNewSafe";

export default function ConnectSafeClient() {
  const chains = useChains();
  const { addSafe } = useSafeWalletContext();
  const { connectNewSafe } = useNewSafe();
  const router = useRouter();

  // State for address, chain, error, loading
  const [safeAddress, setSafeAddress] = useState<`0x${string}`>(
    "" as `0x${string}`,
  );
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Add Safe workflow handler
  async function handleAddSafe() {
    setLoading(true);
    setError(null);
    // Validate address
    if (!/^0x[a-fA-F0-9]{40}$/.test(safeAddress)) {
      setError("Invalid Safe address");
      setLoading(false);
      return;
    }
    // Validate chain
    if (!selectedChain) {
      setError("Please select a network");
      setLoading(false);
      return;
    }
    // Optionally check deployment
    try {
      const safeMeta = await connectNewSafe(safeAddress, Number(selectedChain));
      if (!safeMeta) {
        setError("Failed to connect or add Safe");
        setLoading(false);
        return;
      }
      if ("error" in safeMeta) {
        setError(safeMeta.error);
        setLoading(false);
        return;
      }
      addSafe(selectedChain, safeAddress, safeMeta, true);
      router.push("/accounts");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect or add Safe",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <AppSection className="flex min-h-screen items-center">
      <div className="self-start">
        <BtnCancel href="/accounts" />
      </div>
      <AppCard
        title={
          <div className="flex w-full items-center justify-between">
            Add Safe Account
          </div>
        }
        className="w-full max-w-md"
      >
        <div className="text-base-content text-sm">
          You can only add Safe accounts that are already deployed on the
          selected network. If your Safe is not yet deployed, please use the
          Create Safe flow.
        </div>
        <fieldset className="fieldset w-full">
          <legend className="fieldset-legend">Safe Address</legend>
          <input
            type="text"
            className="input validator flex-1 font-mono"
            placeholder="0x..."
            value={safeAddress}
            onChange={(e) => setSafeAddress(e.target.value as `0x${string}`)}
            pattern="^0x[a-fA-F0-9]{40}$"
            required
            disabled={loading}
          />
        </fieldset>
        <div className="mb-4">
          <label className="mb-2 block font-semibold">Select Network</label>
          <select
            className="select select-bordered w-full"
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value)}
            disabled={loading}
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
        {error && <div className="alert alert-error mb-4">{error}</div>}
        <button
          className="btn btn-primary w-full"
          onClick={handleAddSafe}
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Safe"}
        </button>
      </AppCard>
    </AppSection>
  );
}
