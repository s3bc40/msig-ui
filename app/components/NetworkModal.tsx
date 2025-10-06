"use client";

import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { useChainManager } from "../hooks/useChainManager";
import NetworkChainSvg from "../assets/svg/NetworkChainSvg";
import NetworkForm from "./NetworkForm";
import { NetworkFormState } from "../utils/types";
import XSymbolSvg from "../assets/svg/XSymbolSvg";
import PenEditSvg from "../assets/svg/PenEditSvg";

export default function NetworkModal({
  open,
  onClose,
  suggestedFormState,
}: {
  open: boolean;
  onClose: () => void;
  suggestedFormState?: import("../utils/types").NetworkFormState;
}) {
  const { configChains, removeChainById, addOrUpdateChain } = useChainManager();
  const [showForm, setShowForm] = useState<null | "add" | "edit">(null);
  const [editChain, setEditChain] = useState<NetworkFormState | null>(null);

  // Always pre-fill form when modal is opened and suggestedFormState is present
  useEffect(() => {
    if (open && suggestedFormState) {
      setEditChain(suggestedFormState);
      setShowForm("add");
    }
  }, [open, suggestedFormState]);

  function handleNetworkAdd(state: NetworkFormState) {
    addOrUpdateChain({
      id: Number(state.id),
      name: state.name,
      rpcUrls: { default: { http: [state.rpcUrl] } },
      blockExplorers: state.blockExplorerUrl
        ? {
            default: {
              name: state.blockExplorerName || "Explorer",
              url: state.blockExplorerUrl,
            },
          }
        : undefined,
      nativeCurrency: state.nativeCurrency,
    });
    setEditChain(null);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      showCloseButton={false}
      testid="network-modal"
    >
      <h2 className="mb-4 text-2xl font-bold">Manage Networks</h2>
      {showForm ? (
        <NetworkForm
          setShowForm={setShowForm}
          onSubmit={handleNetworkAdd}
          initialState={editChain}
          onCancel={() => setEditChain(null)}
        />
      ) : (
        <>
          <p>
            Here you can manage your custom networks. You can add or remove
            custom networks as needed.
            <br />
            <span className="text-xs text-gray-400 italic">
              Note: Adding a new network will take over any previously set
              custom network with the same Chain ID.
            </span>
          </p>
          <ul className="list bg-base-100 rounded-box max-h-64 overflow-y-auto shadow-md">
            <li className="p-4 pb-2 text-xs tracking-wide opacity-60">
              Your configured networks
            </li>
            {configChains.length > 0 ? (
              configChains.map((chain) => {
                return (
                  <li className="list-row" key={chain.id}>
                    <div>
                      <div className="rounded-box bg-base-200 flex size-10 items-center justify-center">
                        <NetworkChainSvg />
                      </div>
                    </div>
                    <div>
                      <div>{chain.name}</div>
                      <div className="text-xs font-semibold uppercase opacity-60">
                        Chain ID: {chain.id}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-square btn-ghost"
                        title={`Edit ${chain.name}`}
                        onClick={() => {
                          setEditChain({
                            id: chain.id,
                            name: chain.name,
                            rpcUrl: chain.rpcUrls?.default?.http?.[0] || "",
                            blockExplorerUrl:
                              chain.blockExplorers?.default?.url || "",
                            blockExplorerName:
                              chain.blockExplorers?.default?.name || "",
                            nativeCurrency: chain.nativeCurrency || {
                              name: "",
                              symbol: "",
                              decimals: 18,
                            },
                          });
                          setShowForm("edit");
                        }}
                      >
                        <PenEditSvg />
                      </button>
                      <div
                        className="tooltip tooltip-left"
                        data-tip={
                          configChains.length === 1
                            ? "One chain is required"
                            : undefined
                        }
                      >
                        <button
                          className="btn btn-square btn-ghost"
                          onClick={() => removeChainById(chain.id)}
                          title={`Remove ${chain.name}`}
                          disabled={configChains.length === 1}
                        >
                          <XSymbolSvg />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="p-4 text-center text-sm opacity-60">
                No custom networks added.
              </li>
            )}
          </ul>
          <div className="mb-4 flex items-center justify-center gap-4">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowForm("add")}
              data-testid="network-modal-add-btn"
            >
              Add Network
            </button>
            <button
              className="btn btn-secondary btn-ghost btn-sm"
              onClick={onClose}
              data-testid="network-modal-close-btn"
            >
              Close
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
