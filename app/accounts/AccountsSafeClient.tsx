"use client";

import React, { useState } from "react";
import Link from "next/link";
import AppSection from "@/app/components/AppSection";
import AppCard from "@/app/components/AppCard";
import { useSafeWalletContext } from "../provider/SafeWalletProvider";
import { useChains } from "wagmi";

export default function AccountsPage() {
  const wagmiChains = useChains();
  const { safeWalletData, removeSafe } = useSafeWalletContext();
  const [showDeployed, setShowDeployed] = useState(true);

  // Group safes by safeAddress for accordion display
  const getGroupedSafes = (type: "deployed" | "undeployed") => {
    const grouped: Record<
      string,
      Array<{ chainId: string; owners: string[]; threshold: number }>
    > = {};
    if (type === "deployed") {
      Object.entries(safeWalletData.data.addedSafes).forEach(
        ([chainId, safesObj]) => {
          Object.entries(safesObj).forEach(([safeAddress, meta]) => {
            if (!grouped[safeAddress]) grouped[safeAddress] = [];
            grouped[safeAddress].push({
              chainId,
              owners: meta.owners,
              threshold: meta.threshold,
            });
          });
        },
      );
    } else {
      Object.entries(safeWalletData.data.undeployedSafes).forEach(
        ([chainId, safesObj]) => {
          Object.entries(safesObj).forEach(([safeAddress, config]) => {
            if (!grouped[safeAddress]) grouped[safeAddress] = [];
            grouped[safeAddress].push({
              chainId,
              owners: config.props.safeAccountConfig.owners,
              threshold: config.props.safeAccountConfig.threshold,
            });
          });
        },
      );
    }
    return grouped;
  };

  const groupedSafes = getGroupedSafes(
    showDeployed ? "deployed" : "undeployed",
  );

  return (
    <AppSection className="mx-auto max-w-4xl">
      <AppCard>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold">Safe Accounts</h2>
          <div className="flex gap-2">
            <Link href="/new-safe/create" className="btn btn-primary btn-sm">
              Create Safe
            </Link>
            <Link href="/new-safe/connect" className="btn btn-secondary btn-sm">
              Add Safe
            </Link>
          </div>
        </div>
        <div className="mb-4 flex justify-center">
          <div className="form-control">
            <label className="label cursor-pointer gap-2">
              <span className="label-text">Undeployed</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={showDeployed}
                onChange={() => setShowDeployed(!showDeployed)}
              />
              <span className="label-text">Deployed</span>
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {Object.keys(groupedSafes).length === 0 ? (
            <div className="text-center text-gray-400">No Safes found.</div>
          ) : (
            Object.entries(groupedSafes).map(([safeAddress, chains], idx) => (
              <div
                className="bg-base-100 border-base-300 collapse border"
                key={safeAddress}
              >
                <input type="checkbox" />
                <div className="collapse-title flex items-center gap-2 font-semibold">
                  <span className="font-mono text-lg break-all">
                    {safeAddress}
                  </span>
                  <span className="badge badge-outline badge-sm">
                    {chains.length} chain{chains.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="collapse-content">
                  <ul className="list bg-base-100 rounded-box gap-4 shadow-md">
                    {chains.map(({ chainId, owners, threshold }) => (
                      <li
                        className="list-row border-accent items-center gap-4 border-2"
                        key={chainId}
                      >
                        <div className="text-base-content flex size-10 w-48 items-center font-bold">
                          {wagmiChains.find((c) => c.id.toString() === chainId)
                            ?.name || chainId}
                        </div>
                        <div className="flex flex-col">
                          <div className="mt-1 text-xs font-semibold uppercase opacity-60">
                            Threshold: {threshold}/{owners.length}
                          </div>
                        </div>
                        <Link
                          className="btn btn-square btn-ghost"
                          title="Go to Safe"
                          href={`/safe/${chainId}/${safeAddress}`}
                        >
                          <svg
                            className="size-[1.2em]"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
                            <g
                              strokeLinejoin="round"
                              strokeLinecap="round"
                              strokeWidth="2"
                              fill="none"
                              stroke="currentColor"
                            >
                              <path d="M7 17L17 7" />
                              <path d="M7 7h10v10" />
                            </g>
                          </svg>
                        </Link>
                        <button
                          className="btn btn-square btn-ghost"
                          title="Copy address"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigator.clipboard.writeText(safeAddress);
                          }}
                        >
                          <svg
                            className="size-[1.2em]"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
                            <g
                              strokeLinejoin="round"
                              strokeLinecap="round"
                              strokeWidth="2"
                              fill="none"
                              stroke="currentColor"
                            >
                              <rect
                                x="9"
                                y="9"
                                width="13"
                                height="13"
                                rx="2"
                              ></rect>
                              <rect
                                x="3"
                                y="3"
                                width="13"
                                height="13"
                                rx="2"
                              ></rect>
                            </g>
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          )}
        </div>
      </AppCard>
    </AppSection>
  );
}
