"use client";

import Modal from "./Modal";
import { useChainManager } from "../hooks/useChainManager";
import NetworkChainSvg from "../assets/svg/NetworkChainSvg";

export default function NetworkModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { configChains, removeChainById } = useChainManager();

  return (
    <Modal
      open={open}
      onClose={onClose}
      showCloseButton={false}
      testid="network-modal"
      closeOnClickOutside
    >
      <h2 className="mb-4 text-2xl font-bold">Manage Networks</h2>
      <p className="mb-4">
        Here you can manage your custom networks. You can add or remove custom
        networks as needed.
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
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => removeChainById(chain.id)}
                  title={`Remove ${chain.name}`}
                >
                  <svg
                    className="size-[1.2em]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </li>
            );
          })
        ) : (
          <li className="p-4 text-center text-sm opacity-60">
            No custom networks added.
          </li>
        )}
      </ul>
      <div className="mt-4 text-sm text-gray-500">
        Add network functionality coming soon...
      </div>
    </Modal>
  );
}
