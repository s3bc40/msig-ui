"use client";

import AppSection from "@/app/components/AppSection";
import AppCard from "@/app/components/AppCard";
import { useState } from "react";
import { encodeFunctionData } from "viem";

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

export default function TxBuildPage() {
  // Form state
  const [to, setTo] = useState("");
  const [value, setValue] = useState("");
  const [data, setData] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [useAbi, setUseAbi] = useState(false);
  const [abiJson, setAbiJson] = useState("");
  const [abiMethods, setAbiMethods] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [methodInputs, setMethodInputs] = useState<
    { name: string; type: string }[]
  >([]);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  // Transaction preview
  const preview = {
    to,
    value,
    data: useAbi
      ? (() => {
          try {
            const abi = JSON.parse(abiJson);
            const args = methodInputs.map(
              (input) => inputValues[input.name] ?? "",
            );
            return encodeFunctionData({
              abi,
              functionName: selectedMethod,
              args,
            });
          } catch {
            return "";
          }
        })()
      : data,
    method: useAbi ? selectedMethod : undefined,
    params: useAbi
      ? methodInputs.map((input) => ({
          ...input,
          value: inputValues[input.name] ?? "",
        }))
      : undefined,
  };

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
    let dataHex = data.trim();
    if (useAbi) {
      try {
        const abi = JSON.parse(abiJson);
        const args = methodInputs.map((input) => inputValues[input.name] ?? "");
        dataHex = encodeFunctionData({
          abi,
          functionName: selectedMethod,
          args,
        });
      } catch (err) {
        setError(
          "ABI encoding error: " +
            (err instanceof Error ? err.message : String(err)),
        );
        return;
      }
    } else {
      if (dataHex && !dataHex.startsWith("0x")) {
        setError("Data must be hex and start with 0x.");
        return;
      }
    }
    // TODO: Integrate ProtocolKit transaction build logic here
    console.log({ to: toAddr, value, data: dataHex });
  }

  return (
    <AppSection>
      <div className="flex w-full flex-col gap-4 self-center md:flex-row">
        {/* Builder Form */}
        <div className="w-full md:w-1/2">
          <AppCard title="Build Safe Transaction">
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
                <legend className="fieldset-legend">Data Encoding</legend>
                <div className="flex items-center gap-4">
                  <label className="label cursor-pointer">
                    <span className="label-text">Raw Hex</span>
                    <input
                      type="radio"
                      checked={!useAbi}
                      onChange={() => setUseAbi(false)}
                      className="radio ml-2"
                    />
                  </label>
                  <label className="label cursor-pointer">
                    <span className="label-text">ABI Encode</span>
                    <input
                      type="radio"
                      checked={useAbi}
                      onChange={() => setUseAbi(true)}
                      className="radio ml-2"
                    />
                  </label>
                </div>
              </fieldset>
              {!useAbi ? (
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Data (hex)</legend>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    placeholder="0x..."
                    autoComplete="off"
                  />
                </fieldset>
              ) : (
                <>
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">
                      Contract ABI (JSON)
                    </legend>
                    <textarea
                      className="textarea textarea-bordered w-full"
                      value={abiJson}
                      onChange={(e) => {
                        setAbiJson(e.target.value);
                        try {
                          const abi = JSON.parse(e.target.value);
                          setAbiMethods(getAbiMethods(abi));
                        } catch {
                          setAbiMethods([]);
                        }
                      }}
                      placeholder="Paste contract ABI JSON here"
                      rows={4}
                    />
                  </fieldset>
                  {abiMethods.length > 0 && (
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
                        {abiMethods.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </fieldset>
                  )}
                  {methodInputs.length > 0 && (
                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">
                        Method Parameters
                      </legend>
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
                  )}
                </>
              )}
              {error && (
                <div className="alert alert-error text-sm whitespace-pre-wrap">
                  {error}
                </div>
              )}
              <button type="submit" className="btn btn-primary">
                Build Transaction
              </button>
            </form>
          </AppCard>
        </div>
        {/* Transaction Preview */}
        <div className="w-full md:w-1/2">
          <AppCard title="Transaction Preview">
            <div className="flex flex-col gap-2">
              <div>
                <p className="mb-2 text-lg font-medium">To Address:</p>
                <span className="badge badge-info badge-outline text-base font-bold">
                  {preview.to || "-"}
                </span>
              </div>
              <div className="divider my-0" />
              <div>
                <p className="mb-2 text-lg font-medium">Value (wei):</p>
                <span className="badge badge-accent badge-outline text-base font-bold">
                  {preview.value || "0"}
                </span>
              </div>
              <div className="divider my-0" />
              {useAbi && (
                <>
                  <div>
                    <p className="mb-2 text-lg font-medium">Method:</p>
                    <span className="badge badge-outline text-base-content">
                      {preview.method || "-"}
                    </span>
                  </div>
                  <div className="divider my-0" />
                  <div>
                    <p className="mb-2 text-lg font-medium">Parameters:</p>
                    {preview.params && preview.params.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {preview.params.map((param, idx) => (
                          <span key={idx} className="badge badge-outline">
                            {param.name}:{" "}
                            <span className="font-mono">{param.value}</span>{" "}
                            <span className="text-xs">({param.type})</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="badge badge-outline">No parameters</span>
                    )}
                  </div>
                  <div className="divider my-0" />
                </>
              )}
              <div>
                <p className="mb-2 text-lg font-medium">Data (hex):</p>
                <span className="badge badge-outline font-mono text-xs break-all">
                  {preview.data || "-"}
                </span>
              </div>
            </div>
          </AppCard>
        </div>
      </div>
    </AppSection>
  );
}
