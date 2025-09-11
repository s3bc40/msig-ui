"use client";

import React, { useState } from "react";
import Link from "next/link";
import AppSection from "@/app/components/AppSection";
import AppCard from "@/app/components/AppCard";
import { useSafeWalletContext } from "../provider/SafeWalletProvider";

export default function AccountsPage() {
  const { safeWalletData, removeSafe } = useSafeWalletContext();
  const [showDeployed, setShowDeployed] = useState(true);

  // Helper to flatten safes for table rendering
  const getSafes = (type: "deployed" | "undeployed") => {
    const safes: Array<{
      chainId: string;
      safeAddress: string;
      owners: string[];
      threshold: number;
    }> = [];
    if (type === "deployed") {
      Object.entries(safeWalletData.data.addedSafes).forEach(
        ([chainId, safesObj]) => {
          Object.entries(safesObj).forEach(([safeAddress, meta]) => {
            safes.push({
              chainId,
              safeAddress,
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
            safes.push({
              chainId,
              safeAddress,
              owners: config.props.safeAccountConfig.owners,
              threshold: config.props.safeAccountConfig.threshold,
            });
          });
        },
      );
    }
    return safes;
  };

  const safes = getSafes(showDeployed ? "deployed" : "undeployed");

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
              <span className="label-text">Deployed</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={showDeployed}
                onChange={() => setShowDeployed(!showDeployed)}
              />
              <span className="label-text">Undeployed</span>
            </label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table-zebra table w-full">
            <thead>
              <tr>
                <th>Chain ID</th>
                <th>Safe Address</th>
                <th>Owners</th>
                <th>Threshold</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {safes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400">
                    No Safes found.
                  </td>
                </tr>
              ) : (
                safes.map(({ chainId, safeAddress, owners, threshold }) => (
                  <tr key={chainId + safeAddress}>
                    <td>{chainId}</td>
                    <td className="font-mono text-xs">{safeAddress}</td>
                    <td>
                      <ul className="ml-4 list-disc">
                        {owners.map((owner) => (
                          <li key={owner} className="font-mono text-xs">
                            {owner}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>{threshold}</td>
                    <td>
                      <button
                        className="btn btn-error btn-xs"
                        onClick={() =>
                          removeSafe(chainId, safeAddress, showDeployed)
                        }
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AppCard>
    </AppSection>
  );
}
