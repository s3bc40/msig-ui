"use client";

import AppSection from "@/app/components/AppSection";
import AppCard from "@/app/components/AppCard";
import { useState } from "react";
import React from "react";
import useSafe from "@/app/hooks/useSafe";
import { useParams, useRouter } from "next/navigation";
import BtnCancel from "@/app/components/BtnCancel";

type AbiFunctionItem = {
  type: string;
  name: string;
  inputs?: { name: string; type: string }[];
};

function getAbiMethods(abi: AbiFunctionItem[]): string[] {
  return abi
    .filter((item) => item.type === "function")
    .map((item) => item.name);
}

function getAbiMethodInputs(
  abi: AbiFunctionItem[],
  methodName: string,
): { name: string; type: string }[] {
  const method = abi.find(
    (item) => item.type === "function" && item.name === methodName,
  );
  return method?.inputs ?? [];
}

function handleAbiMethodSelect(
  abiJson: string,
  methodName: string,
  setSelectedMethod: (name: string) => void,
  setMethodInputs: (inputs: { name: string; type: string }[]) => void,
  setInputValues: (vals: Record<string, string>) => void,
) {
  setSelectedMethod(methodName);
  try {
    const abi = JSON.parse(abiJson);
    setMethodInputs(getAbiMethodInputs(abi, methodName));
    setInputValues({});
  } catch {
    setMethodInputs([]);
  }
}

function parseAbiMethodsFromJson(json: string): string[] {
  try {
    const abi = JSON.parse(json);
    return getAbiMethods(abi);
  } catch {
    return [];
  }
}

export default function NewSafeTxPage() {
  // Hooks
  const { address: safeAddress } = useParams();
  const router = useRouter();
  const { buildSafeTransaction, getSafeTransactionHash, isOwner } = useSafe(
    safeAddress as `0x${string}`,
  );
  // Form state
  const [to, setTo] = useState("");
  const [value, setValue] = useState("");
  const [data, setData] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showDataHex, setShowDataHex] = useState(false);
  const [abiJson, setAbiJson] = useState("");
  const [abiMethods, setAbiMethods] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [methodInputs, setMethodInputs] = useState<
    { name: string; type: string }[]
  >([]);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  // Transactions array state
  const [transactions, setTransactions] = useState<
    {
      to: string;
      value: string;
      data: string;
      operation?: number;
      method: string;
    }[]
  >([]);

  // ProtocolKit integration: build Safe transaction
  async function handleBuildSafeTransaction() {
    setError(null);
    try {
      // Map transactions to ProtocolKit's SafeTransactionData format
      const txs = transactions.map((tx) => ({
        to: tx.to,
        value: tx.value,
        data: tx.data,
        operation: tx.operation ?? 0,
      }));
      // Build transaction using ProtocolKit
      const safeTx = await buildSafeTransaction(txs);
      if (!safeTx) {
        setError("Invalid transaction");
        return;
      }
      const hash = await getSafeTransactionHash(safeTx);
      // Redirect to tx details page
      router.push(`/safe/${safeAddress}/tx/${hash}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function handleBuildTx(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const toAddr = to.trim();
    if (!toAddr || !toAddr.startsWith("0x") || toAddr.length !== 42) {
      setError("Invalid recipient address format.");
      return;
    }
    if (isNaN(Number(value)) || Number(value) < 0) {
      setError("Value must be a non-negative number.");
      return;
    }
    const dataHex = data.trim();
    let methodLabel = "Transfer";
    if (dataHex) {
      methodLabel = "Custom hex";
    } else if (abiJson && abiMethods.length > 0 && selectedMethod) {
      methodLabel = selectedMethod;
    }
    setTransactions((txs) => [
      ...txs,
      {
        to: toAddr,
        value,
        data: dataHex || "0x",
        operation: 0, // Default to Call
        method: methodLabel,
      },
    ]);
    // Reset form
    setTo("");
    setValue("");
    setData("");
    setAbiJson("");
    setAbiMethods([]);
    setSelectedMethod("");
    setMethodInputs([]);
    setInputValues({});
    setShowDataHex(false);
  }
  // Remove transaction from list
  function handleRemoveTransaction(idx: number) {
    setTransactions((txs) => txs.filter((_, i) => i !== idx));
  }

  return (
    <AppSection>
      <div className="mb-4">
        <BtnCancel href={`/safe/${safeAddress}`} label="Back to Safe" />
      </div>
      <div className="flex w-full flex-col gap-4 self-center md:flex-row">
        {/* Builder Form (left) */}
        <div className="w-full md:w-1/2">
          <AppCard title="Add Transaction">
            <form className="flex flex-col gap-4" onSubmit={handleBuildTx}>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Recipient (to)</legend>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="0x..."
                  pattern="^0x[a-fA-F0-9]{40}$"
                  required
                  autoComplete="off"
                />
              </fieldset>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Value (wei)</legend>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0"
                  min="0"
                  required
                  autoComplete="off"
                />
              </fieldset>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Contract ABI (JSON)</legend>
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={abiJson}
                  onChange={(e) => {
                    setAbiJson(e.target.value);
                    setAbiMethods(parseAbiMethodsFromJson(e.target.value));
                  }}
                  placeholder="Paste contract ABI JSON here"
                  rows={4}
                />
              </fieldset>
              {abiMethods.length > 0 && !showDataHex && (
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Method</legend>
                  <select
                    className="select select-bordered w-full"
                    value={selectedMethod}
                    onChange={(e) =>
                      handleAbiMethodSelect(
                        abiJson,
                        e.target.value,
                        setSelectedMethod,
                        setMethodInputs,
                        setInputValues,
                      )
                    }
                  >
                    <option value="">Select method</option>
                    {abiMethods.map((method, idx) => (
                      <option key={`${method}-${idx}`} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </fieldset>
              )}
              {methodInputs.length > 0 && (
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Method Parameters</legend>
                  <div className="flex flex-col gap-2">
                    {methodInputs.map((input) => (
                      <input
                        key={input.name}
                        type="text"
                        className="input input-bordered w-full"
                        placeholder={`${input.name} (${input.type})`}
                        value={inputValues[input.name] ?? ""}
                        onChange={(e) =>
                          setInputValues((vals) => ({
                            ...vals,
                            [input.name]: e.target.value,
                          }))
                        }
                        autoComplete="off"
                      />
                    ))}
                  </div>
                </fieldset>
              )}{" "}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Data (hex)</legend>
                <label className="label cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDataHex}
                    onChange={() => setShowDataHex((v) => !v)}
                    className="toggle toggle-xs"
                  />
                  <span className="ml-2">Show Data Hex</span>
                </label>
                {showDataHex && (
                  <>
                    <textarea
                      className="textarea textarea-bordered mt-2 w-full"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      placeholder="0x..."
                      autoComplete="off"
                    />
                  </>
                )}
              </fieldset>
              {error && (
                <div className="alert alert-error text-sm whitespace-pre-wrap">
                  {error}
                </div>
              )}
              <button type="submit" className="btn btn-primary">
                Add Transaction
              </button>
            </form>
          </AppCard>
        </div>
        {/* Transactions List & Build (right) */}
        <div className="w-full md:w-1/2">
          <AppCard title="Transactions List">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Recipient</th>
                    <th>Method</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center text-sm text-gray-400"
                      >
                        No transactions added
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td className="font-mono text-xs break-all">
                          {tx.to.length === 42
                            ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`
                            : tx.to}
                        </td>
                        <td>{tx.method}</td>
                        <td>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => handleRemoveTransaction(idx)}
                            type="button"
                            aria-label="Remove transaction"
                          >
                            X
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <button
              className="btn btn-primary mt-4"
              type="button"
              onClick={handleBuildSafeTransaction}
              disabled={transactions.length === 0 || !isOwner}
              title={
                !isOwner ? "Only Safe owners can build transactions" : undefined
              }
            >
              Build Safe Transaction
            </button>
          </AppCard>
        </div>
      </div>
    </AppSection>
  );
}
