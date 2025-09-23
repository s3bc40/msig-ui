"use client";

import {
  EthSafeSignature,
  EthSafeTransaction,
} from "@safe-global/protocol-kit";
import React, { createContext, useContext, useEffect, useRef } from "react";
import { SAFE_TX_STORAGE_KEY } from "../utils/constants";

export interface SafeTxContextType {
  saveTransaction: (safeAddress: string, txObj: EthSafeTransaction) => void;
  getTransaction: (safeAddress: string) => EthSafeTransaction | null;
  removeTransaction: (safeAddress: string) => void;
  exportTx: (safeAddress: string) => string;
  importTx: (safeAddress: string, json: string) => void;
}

const SafeTxContext = createContext<SafeTxContextType | undefined>(undefined);

export const SafeTxProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // In-memory map of current transactions per safeAddress
  const currentTxMapRef = useRef<{
    [safeAddress: string]: EthSafeTransaction | null;
  }>({});

  // Hydrate all transactions from localStorage on mount
  type StoredTx = {
    data: EthSafeTransaction["data"];
    signatures?: EthSafeSignature[];
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawMap = localStorage.getItem(SAFE_TX_STORAGE_KEY);
      if (rawMap) {
        const parsedMap: Record<string, StoredTx> = JSON.parse(rawMap);
        Object.entries(parsedMap).forEach(([safeAddress, parsed]) => {
          let txObj: EthSafeTransaction | null = null;
          if (parsed && typeof parsed === "object" && "data" in parsed) {
            txObj = new EthSafeTransaction(parsed.data);
            if (parsed.signatures && Array.isArray(parsed.signatures)) {
              parsed.signatures.forEach(
                (sig: {
                  signer: string;
                  data: string;
                  isContractSignature: boolean;
                }) => {
                  const ethSignature = new EthSafeSignature(
                    sig.signer,
                    sig.data,
                    sig.isContractSignature,
                  );
                  txObj!.addSignature(ethSignature);
                },
              );
            }
          }
          currentTxMapRef.current[safeAddress] = txObj;
        });
      }
    } catch {
      // Ignore hydration errors
    }
  }, []);

  // Set the transaction for a specific safeAddress
  function saveTransaction(safeAddress: string, txObj: EthSafeTransaction) {
    const txToSave = {
      data: txObj.data,
      signatures: txObj.signatures ? Array.from(txObj.signatures.values()) : [],
    };
    currentTxMapRef.current[safeAddress] = txObj;
    if (typeof window !== "undefined") {
      // Get full map, update, and save
      let map: Record<string, StoredTx> = {};
      const rawMap = localStorage.getItem(SAFE_TX_STORAGE_KEY);
      if (rawMap) {
        map = JSON.parse(rawMap);
      }
      map[safeAddress] = txToSave;
      localStorage.setItem(SAFE_TX_STORAGE_KEY, JSON.stringify(map));
    }
  }

  // Get the transaction for a specific safeAddress
  function getTransaction(safeAddress: string): EthSafeTransaction | null {
    return currentTxMapRef.current[safeAddress] || null;
  }

  // Remove the transaction for a specific safeAddress
  function removeTransaction(safeAddress: string) {
    currentTxMapRef.current[safeAddress] = null;
    if (typeof window !== "undefined") {
      let map: Record<string, StoredTx> = {};
      const rawMap = localStorage.getItem(SAFE_TX_STORAGE_KEY);
      if (rawMap) {
        map = JSON.parse(rawMap);
      }
      delete map[safeAddress];
      localStorage.setItem(SAFE_TX_STORAGE_KEY, JSON.stringify(map));
    }
  }

  // Export transaction for a specific safeAddress as JSON
  function exportTx(safeAddress: string): string {
    const tx = currentTxMapRef.current[safeAddress];
    if (!tx) return "";
    // Serialize signatures to plain objects
    const signatures = tx.signatures
      ? Array.from(tx.signatures.values()).map((sig) => ({
          signer: sig.signer,
          data: sig.data,
          isContractSignature: sig.isContractSignature,
        }))
      : [];
    return JSON.stringify({ tx: { data: tx.data, signatures } });
  }

  // Import transaction for a specific safeAddress from JSON
  function importTx(safeAddress: string, json: string) {
    try {
      const obj = JSON.parse(json);
      if (obj.tx) {
        // Expect obj.tx to be a StoredTx
        let txObj: EthSafeTransaction | null = null;
        if (obj.tx.data) {
          txObj = new EthSafeTransaction(obj.tx.data);
          if (obj.tx.signatures && Array.isArray(obj.tx.signatures)) {
            obj.tx.signatures.forEach(
              (sig: {
                signer: string;
                data: string;
                isContractSignature: boolean;
              }) => {
                const ethSignature = new EthSafeSignature(
                  sig.signer,
                  sig.data,
                  sig.isContractSignature,
                );
                txObj!.addSignature(ethSignature);
              },
            );
          }
        }
        currentTxMapRef.current[safeAddress] = txObj;
        if (typeof window !== "undefined") {
          let map: Record<string, StoredTx> = {};
          const rawMap = localStorage.getItem(SAFE_TX_STORAGE_KEY);
          if (rawMap) {
            map = JSON.parse(rawMap);
          }
          map[safeAddress] = obj.tx;
          localStorage.setItem(SAFE_TX_STORAGE_KEY, JSON.stringify(map));
        }
      }
    } catch {
      // Invalid import
    }
  }

  return (
    <SafeTxContext.Provider
      value={{
        saveTransaction,
        getTransaction,
        removeTransaction,
        exportTx,
        importTx,
      }}
    >
      {children}
    </SafeTxContext.Provider>
  );
};

export function useSafeTxContext() {
  const ctx = useContext(SafeTxContext);
  if (!ctx)
    throw new Error("useSafeTxContext must be used within a SafeTxProvider");
  return ctx;
}
