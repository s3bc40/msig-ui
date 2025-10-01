import React from "react";
import Modal from "./Modal";
import { useChainManager } from "../hooks/useChainManager";

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
      closeLabel="Close Networks"
      testid="network-modal"
    >
      <h2 className="mb-4 text-2xl font-bold">Manage Networks</h2>
      <p className="mb-4">
        Here you can manage your custom networks. You can add or remove custom
        networks as needed.
      </p>
      <ul className="mb-4 flex flex-col gap-2">
        {configChains.length > 0 ? (
          configChains.map((chain) => (
            <li key={chain.id} className="flex items-center justify-between">
              <span>
                {chain.name} ({chain.id})
              </span>
              <button
                className="btn btn-xs btn-error"
                onClick={() => removeChainById(chain.id)}
                title={`Remove ${chain.name}`}
              >
                Remove
              </button>
            </li>
          ))
        ) : (
          <li>No custom networks added.</li>
        )}
      </ul>
      <div className="text-sm text-gray-500">
        Add network functionality coming soon...
      </div>
    </Modal>
  );
}
