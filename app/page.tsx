"use client";
import { useState } from "react";
import { useAccount, useClient } from "wagmi";

// TODO implement protocol kit to connect to safe

export default function Home() {
  const { isConnected } = useAccount();
  const client = useClient();
  const [safeAddress, setSafeAddress] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center justify-center gap-6 px-4 py-10">
      <h1 className="mb-2 text-center text-3xl font-bold">
        Welcome to the Home Page
      </h1>
      {isConnected ? (
        !submitted ? (
          <form
            onSubmit={handleSubmit}
            className="flex w-full flex-col gap-4 rounded-lg p-4"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="safeAddress" className="font-semibold">
                Enter Safe Address
              </label>
              <input
                id="safeAddress"
                type="text"
                value={safeAddress}
                onChange={(e) => setSafeAddress(e.target.value)}
                placeholder="0x..."
                className="input input-bordered w-full"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Submit
            </button>
          </form>
        ) : (
          <div className="flex w-full flex-col gap-2 rounded-lg p-4 shadow">
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <span className="font-semibold">Network:</span>
              <span>{client?.chain?.name || "Unknown"}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <span className="font-semibold">Safe Address:</span>
              <span className="break-all">{safeAddress}</span>
            </div>
          </div>
        )
      ) : (
        <p className="text-center text-lg">
          Please connect your wallet to get started.
        </p>
      )}
    </section>
  );
}
