"use client";

import AppSection from "@/app/components/AppSection";
import AppCard from "@/app/components/AppCard";
import { useParams, useRouter } from "next/navigation";
import useSafe from "@/app/hooks/useSafe";
import { useEffect, useState, useRef } from "react";
import { EthSafeTransaction } from "@safe-global/protocol-kit";
import { useSafeTxContext } from "@/app/provider/SafeTxProvider";
import DataPreview from "@/app/components/DataPreview";
import BtnCancel from "@/app/components/BtnCancel";
import { BroadcastModal } from "@/app/components/BroadcastModal";
import { useAccount } from "wagmi";

export default function TxDetailsClient() {
  const { chain } = useAccount();
  const params = useParams();
  const safeAddress = params.address as `0x${string}`;
  const router = useRouter();
  const {
    getSafeTransactionCurrent,
    signSafeTransaction,
    broadcastSafeTransaction,
    isOwner,
    hasSigned,
    safeInfo,
  } = useSafe(safeAddress);
  const { removeTransaction } = useSafeTxContext();

  const toastRef = useRef<HTMLDivElement | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [broadcastHash, setBroadcastHash] = useState<string | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [safeTx, setSafeTx] = useState<EthSafeTransaction | null>(null);
  const [signing, setSigning] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let cancelled = false;
    async function fetchTx() {
      try {
        const tx = await getSafeTransactionCurrent();
        if (!cancelled) setSafeTx(tx);
      } catch {
        if (!cancelled) {
          setToast({ type: "error", message: "Could not load transaction" });
          setTimeout(() => setToast(null), 3000);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTx();
    return () => {
      cancelled = true;
    };
  }, [getSafeTransactionCurrent, safeInfo]);

  async function handleSign() {
    setSigning(true);
    if (!safeTx) {
      setSigning(false);
      return;
    }
    try {
      const signedTx = await signSafeTransaction(safeTx);
      if (!signedTx) {
        setToast({ type: "error", message: "Signing failed" });
      } else {
        setToast({ type: "success", message: "Signature added!" });
        setSafeTx(signedTx);
      }
    } catch (e) {
      console.error("Signing error:", e);
      setToast({ type: "error", message: "Signing failed" });
    }
    setSigning(false);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleBroadcast() {
    if (!safeTx) return;
    setBroadcasting(true);
    try {
      const result = await broadcastSafeTransaction(safeTx);
      let txHash = "";
      if (result && typeof result === "object") {
        txHash = result?.hash;
      }
      setBroadcastHash(txHash || null);
      setBroadcastError(null);
      setShowModal(true);
      setToast({ type: "success", message: "Broadcast successful!" });
    } catch (err) {
      setBroadcastError(err instanceof Error ? err.message : String(err));
      setShowModal(true);
      setToast({ type: "error", message: "Broadcast failed" });
    }
    setBroadcasting(false);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <AppSection>
      <div className="mb-4">
        <BtnCancel href={`/safe/${safeAddress}`} label="Back to Safe" />
      </div>
      <AppCard title="Safe Transaction">
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="loading loading-dots loading-lg" />
            </div>
          ) : safeTx ? (
            <>
              {/* Transaction details: simple flex column with DaisyUI dividers */}
              <div className="bg-base-200 rounded-box divide-base-100 flex max-h-80 flex-col divide-y overflow-y-auto shadow-md">
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
                <div className="flex items-center justify-between px-4 py-3 text-right">
                  <span className="font-semibold">Data</span>
                  <DataPreview value={safeTx.data.data} />
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
                <div className="flex flex-col gap-1 px-4 py-3">
                  <span className="mb-1 font-semibold">Signatures</span>
                  {safeTx.signatures && safeTx.signatures.size > 0 ? (
                    [...safeTx.signatures.values()].map((sigObj, idx) => (
                      <span key={idx} className="font-mono text-xs break-all">
                        Sig {idx + 1}: {sigObj.data}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">No signatures</span>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="btn btn-success"
                  onClick={handleSign}
                  disabled={!isOwner || signing || hasSigned}
                  title={"Signing tx"}
                >
                  {!isOwner ? (
                    "Only Safe owners can sign"
                  ) : hasSigned ? (
                    "Already Signed"
                  ) : signing ? (
                    <div className="flex items-center">
                      <span>Signing in progress</span>
                      <span className="loading loading-dots loading-xs ml-2" />
                    </div>
                  ) : (
                    "Sign Transaction"
                  )}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleBroadcast}
                  disabled={
                    !(
                      safeTx &&
                      safeInfo &&
                      safeTx.signatures?.size >= safeInfo.threshold
                    ) || broadcasting
                  }
                  title="Broadcasting tx"
                >
                  {broadcasting ? (
                    <div className="flex items-center">
                      <span>Broadcasting in progress</span>
                      <span className="loading loading-dots loading-xs ml-2" />
                    </div>
                  ) : (
                    "Broadcast Transaction"
                  )}
                </button>
              </div>
              {/* BroadcastModal for broadcast feedback */}
              {showModal && (
                <BroadcastModal
                  open={showModal}
                  txHash={broadcastHash}
                  error={broadcastError}
                  blockExplorerUrl={chain?.blockExplorers?.default?.url}
                  onClose={() => setShowModal(false)}
                  onSuccess={() => {
                    removeTransaction(safeAddress);
                    setShowModal(false);
                    router.push(`/safe/${safeAddress}`);
                  }}
                  successLabel="Back to Safe"
                />
              )}
            </>
          ) : (
            <div className="text-gray-400">Transaction not found.</div>
          )}
          {/* DaisyUI toast notification */}
          {toast && (
            <div
              ref={toastRef}
              className={`toast toast-center z-50`}
              style={{
                position: "fixed",
                left: 0,
                right: 0,
                top: "2rem",
                margin: "auto",
                width: "fit-content",
              }}
            >
              <div className={`alert alert-${toast.type}`}>{toast.message}</div>
            </div>
          )}
        </div>
      </AppCard>
    </AppSection>
  );
}
