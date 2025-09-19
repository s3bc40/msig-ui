"use client";

import AppSection from "@/app/components/AppSection";
import AppCard from "@/app/components/AppCard";
import { useParams } from "next/navigation";
import useSafe from "@/app/hooks/useSafe";
import { useEffect, useState } from "react";
import { EthSafeTransaction } from "@safe-global/protocol-kit";
import { useAccount } from "wagmi";

export default function TxDetailsPage() {
  const { chainId } = useAccount();
  const params = useParams();
  // Support both txHash and tx-hash param keys
  const txHash = params.txHash;
  const safeAddress = params.address as `0x${string}`;
  const {
    getSafeTransactionByHash,
    signSafeTransaction,
    broadcastSafeTransaction,
    isOwner,
    safeInfo,
  } = useSafe(safeAddress);
  // Get chainId from addressBook or context
  const [safeTx, setSafeTx] = useState<EthSafeTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [broadcastResult, setBroadcastResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setError(null);
    // Wait for kit and safeInfo to be ready before fetching tx
    console.log("Effect triggered with:", { chainId, txHash, safeInfo });
    if (!chainId || !txHash || !safeInfo) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    async function fetchTx() {
      try {
        console.log("Fetching tx for hash:", txHash);
        const tx = await getSafeTransactionByHash(txHash as string);
        console.log("Fetched tx:", tx);
        if (!cancelled) setSafeTx(tx);
        if (!tx) setError("Could not load transaction");
      } catch {
        if (!cancelled) setError("Could not load transaction");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTx();
    return () => {
      cancelled = true;
    };
  }, [getSafeTransactionByHash, txHash, chainId, safeInfo]);

  async function handleSign() {
    setError(null);
    if (!safeTx) return;
    try {
      const signedTx = await signSafeTransaction(safeTx);
      setSafeTx(signedTx);
    } catch {
      setError("Signing failed");
    }
  }

  async function handleBroadcast() {
    setError(null);
    if (!safeTx) return;
    try {
      const result = await broadcastSafeTransaction(safeTx);
      setBroadcastResult(result);
    } catch {
      setError("Broadcast failed");
    }
  }

  return (
    <AppSection>
      <AppCard title="Safe Transaction">
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="loading loading-dots loading-lg" />
            </div>
          ) : safeTx ? (
            <>
              {/* Transaction details: simple flex column with DaisyUI dividers */}
              <div className="bg-base-200 rounded-box divide-base-100 flex flex-col divide-y shadow-md">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="font-semibold">To</span>
                  <span className="max-w-[60%] truncate" title={safeTx.data.to}>
                    {safeTx.data.to}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="font-semibold">Value</span>
                  <span>
                    {safeTx.data.value?.toString?.() ??
                      String(safeTx.data.value)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="font-semibold">Nonce</span>
                  <span>{safeTx.data.nonce}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="font-semibold">Operation</span>
                  <span>{safeTx.data.operation}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="font-semibold">Signatures</span>
                  <span>{safeTx.signatures?.size ?? 0}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="font-semibold">Data</span>
                  <span
                    className="max-w-[60%] truncate"
                    title={safeTx.data.data}
                  >
                    {safeTx.data.data}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="font-semibold">Gas Price</span>
                  <span>{safeTx.data.gasPrice}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="font-semibold">Base Gas</span>
                  <span>{safeTx.data.baseGas}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="font-semibold">SafeTxGas</span>
                  <span>{safeTx.data.safeTxGas}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="font-semibold">Gas Token</span>
                  <span
                    className="max-w-[60%] truncate"
                    title={safeTx.data.gasToken}
                  >
                    {safeTx.data.gasToken}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="font-semibold">Refund Receiver</span>
                  <span
                    className="max-w-[60%] truncate"
                    title={safeTx.data.refundReceiver}
                  >
                    {safeTx.data.refundReceiver}
                  </span>
                </div>
              </div>
              <button
                className="btn btn-success"
                onClick={handleSign}
                disabled={!isOwner}
                title={!isOwner ? "Only Safe owners can sign" : undefined}
              >
                Sign Transaction
              </button>
              <button
                className="btn btn-primary"
                onClick={handleBroadcast}
                disabled={
                  !(
                    safeTx &&
                    safeInfo &&
                    safeTx.signatures?.size >= safeInfo.threshold
                  )
                }
                title={
                  safeTx &&
                  safeInfo &&
                  safeTx.signatures?.size < safeInfo.threshold
                    ? `Requires ${safeInfo.threshold} signatures to broadcast`
                    : undefined
                }
              >
                Broadcast Transaction
              </button>
              {broadcastResult && (
                <div className="alert alert-info">
                  Broadcasted: {JSON.stringify(broadcastResult)}
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-400">Transaction not found.</div>
          )}
          {error && <div className="alert alert-error">{error}</div>}
        </div>
      </AppCard>
    </AppSection>
  );
}
