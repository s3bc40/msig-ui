"use client";
import { useState } from "react";
import Safe, {
  SafeAccountConfig,
  SafeDeploymentConfig,
  PredictedSafeProps,
} from "@safe-global/protocol-kit";
import { useAccount, useClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

// TODO implement protocol kit to connect to safe
export default function HomePage() {
  const { isConnected, address } = useAccount();
  const client = useClient();
  const [safeAddress, setSafeAddress] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [mode, setMode] = useState<"create" | "connect" | null>(null);
  const [owners, setOwners] = useState<string[]>([""]);
  const [threshold, setThreshold] = useState<number>(2);
  const [creating, setCreating] = useState(false);
  const [safeResult, setSafeResult] = useState<Safe | null>(null);
  const [error, setError] = useState<string>("");

  const handleModeSelect = (selected: "create" | "connect") => {
    setMode(selected);
    setSafeResult(null);
    setError("");
  };

  const handleOwnerChange = (idx: number, value: string) => {
    setOwners((prev) => prev.map((o, i) => (i === idx ? value : o)));
  };

  const addOwnerField = () => setOwners((prev) => [...prev, ""]);
  const removeOwnerField = (idx: number) =>
    setOwners((prev) => prev.filter((_, i) => i !== idx));

  const handleCreateSafe = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      // Dummy provider/signer for now
      const provider = client?.chain.rpcUrls[0].http[0];
      if (!provider) throw new Error("No provider");

      // Create a signer
      const signer = address;
      const safeAccountConfig: SafeAccountConfig = {
        owners: owners.filter((o) => o),
        threshold,
      };
      const safeDeploymentConfig: SafeDeploymentConfig = {
        saltNonce: Math.floor(Math.random() * 1000000).toString(),
        safeVersion: "1.4.1",
        deploymentType: "canonical",
      };
      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig,
      };
      const protocolKit = await Safe.init({
        provider,
        signer,
        predictedSafe,
        isL1SafeSingleton: true,
      });
      setSafeResult(protocolKit);
    } catch (err: unknown) {
      setError((err as Error)?.message || "Failed to create Safe");
    }
    setCreating(false);
  };

  return (
    <div className="mx-auto flex min-h-full w-full flex-col items-center justify-center gap-6 p-10">
      <div className="card card-xl bg-base-100">
        <div className="card-body items-center gap-10 text-center">
          <h2 className="card-title text-4xl">MSIG UI</h2>
          <p className="text-xl">
            Your local safe wallet app to manage safe accounts.
          </p>
          <p className="text-lg">Connect your wallet to get started.</p>
          {isConnected ? (
            <Link href="/new-safe" className="btn btn-primary rounded">
              Continue with {address?.slice(0, 6) + "..." + address?.slice(-4)}
            </Link>
          ) : (
            <ConnectButton chainStatus={"none"} showBalance={false} />
          )}
        </div>
      </div>
    </div>

    // <section className="mx-auto flex min-h-full flex-col items-center justify-center gap-6 px-4 py-10">
    //   {isConnected ? (
    //     mode === null ? (
    //       <div className="flex w-full flex-col gap-4">
    //         <button
    //           className="btn btn-primary btn-soft"
    //           onClick={() => handleModeSelect("create")}
    //         >
    //           Create Safe Account
    //         </button>
    //         <button
    //           className="btn btn-primary btn-soft"
    //           onClick={() => handleModeSelect("connect")}
    //         >
    //           Connect to Safe Account
    //         </button>
    //       </div>
    //     ) : mode === "create" ? (
    //       <form
    //         onSubmit={handleCreateSafe}
    //         className="flex w-full flex-col gap-4 rounded-lg p-4"
    //       >
    //         <div className="flex flex-col gap-2">
    //           {owners.map((owner, idx) => (
    //             <div key={idx} className="flex items-center gap-2">
    //               <fieldset className="fieldset w-full">
    //                 <legend className="fieldset-legend">Owner {idx + 1}</legend>
    //                 <div className="flex items-center gap-2">
    //                   <input
    //                     type="text"
    //                     value={owner}
    //                     onChange={(e) => handleOwnerChange(idx, e.target.value)}
    //                     placeholder="0x..."
    //                     className="input validator w-full"
    //                     pattern="^0x[a-fA-F0-9]{40}$"
    //                     required
    //                   />
    //                   {owners.length > 1 && (
    //                     <button
    //                       type="button"
    //                       className="btn btn-outline btn-secondary"
    //                       onClick={() => removeOwnerField(idx)}
    //                     >
    //                       -
    //                     </button>
    //                   )}
    //                 </div>
    //               </fieldset>
    //             </div>
    //           ))}
    //           <button
    //             type="button"
    //             className="btn btn-secondary btn-soft w-fit"
    //             onClick={addOwnerField}
    //           >
    //             + Add Owner
    //           </button>
    //         </div>
    //         <fieldset className="fieldset w-full">
    //           <legend className="fieldset-legend">Threshold</legend>
    //           <div className="flex items-center gap-2">
    //             <input
    //               type="number"
    //               min={1}
    //               max={owners.length}
    //               step={1}
    //               value={threshold}
    //               onChange={(e) => setThreshold(Number(e.target.value))}
    //               className="input validator w-fit"
    //               required
    //             />
    //             <p className="text-sm">
    //               out of {owners.length} signers required to confirm a
    //               transaction
    //             </p>
    //           </div>
    //           <p className="validator-hint">
    //             Threshold must be between 1 and {owners.length}
    //           </p>
    //         </fieldset>
    //         <button
    //           type="submit"
    //           className="btn btn-primary btn-soft"
    //           disabled={creating}
    //         >
    //           {creating ? "Creating..." : "Create"}
    //         </button>
    //         {error && <div className="text-error">{error}</div>}
    //         {safeResult && (
    //           <div className="alert alert-success mt-2">
    //             Safe created! (see console for details)
    //           </div>
    //         )}
    //       </form>
    //     ) : (
    //       <div className="alert alert-info">Connect to Safe: Coming soon</div>
    //     )
    //   ) : (
    //     <div className="card card-xl bg-base-100 w-full">
    //       <div className="card-body items-center gap-10 text-center">
    //         <h2 className="card-title text-4xl">MSIG UI</h2>
    //         <p className="text-xl">
    //           Your local safe wallet app to manage safe accounts.
    //         </p>
    //         <p className="text-lg">Connect your wallet to get started.</p>
    //         <ConnectButton chainStatus={"none"} showBalance={false} />
    //       </div>
    //     </div>
    //   )}
    // </section>
  );
}
