"use client";
import Safe, {
  EthSafeSignature,
  EthSafeTransaction,
} from "@safe-global/protocol-kit";
import React, { createContext, useContext, useEffect, useRef } from "react";

// Type for cache key
export type SafeKitKey = `${string}:${string}`; // chainId:safeAddress

export interface SafeKitContextType {
  getKit: (chainId: string, safeAddress: string) => Safe | undefined;
  setKit: (chainId: string, safeAddress: string, kit: Safe) => void;
  saveTransaction: (txObj: EthSafeTransaction) => void;
  getTransaction: () => EthSafeTransaction | null;
  removeTransaction: () => void;
  exportCurrentTx: () => string;
  importTx: (json: string) => void;
}

const SafeKitContext = createContext<SafeKitContextType | undefined>(undefined);

export const SafeKitProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use a ref to persist cache across renders
  const kitCache = useRef<Map<SafeKitKey, Safe>>(new Map());

  // LocalStorage keys
  const TX_STORAGE_KEY = "safeCurrentTx";
  // Removed SIG_STORAGE_KEY, signatures are stored in the transaction

  // Single current transaction (in memory only)
  const currentTxRef = useRef<EthSafeTransaction | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawTx = localStorage.getItem(TX_STORAGE_KEY);
      console.log("Hydrating current transaction from storage:", rawTx);
      if (rawTx) {
        const parsed = JSON.parse(rawTx);
        // Rehydrate as EthSafeTransaction and add signatures
        let txObj: EthSafeTransaction | null = null;
        console.log("Parsed transaction data:", parsed);
        if (parsed.data) {
          txObj = new EthSafeTransaction(parsed.data);
        }
        if (txObj && parsed.signatures && Array.isArray(parsed.signatures)) {
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
        currentTxRef.current = txObj;
        console.log("Hydrated current transaction:", currentTxRef.current);
      }
    } catch {
      // Ignore hydration errors
    }
  }, []);

  // Set the current transaction
  function saveTransaction(txObj: EthSafeTransaction) {
    // Serialize signatures as array of SafeSignature objects
    const txToSave = {
      data: txObj.data,
      signatures: txObj.signatures ? Array.from(txObj.signatures.values()) : [],
    };
    currentTxRef.current = txObj;
    if (typeof window !== "undefined") {
      localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(txToSave));
    }
  }

  // Get the current transaction
  function getTransaction(): EthSafeTransaction | null {
    return currentTxRef.current;
  }

  // Remove the current transaction
  function removeTransaction() {
    currentTxRef.current = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(TX_STORAGE_KEY);
    }
  }

  // Export current transaction as JSON
  function exportCurrentTx(): string {
    if (!currentTxRef.current) return "";
    return JSON.stringify({ tx: currentTxRef.current });
  }

  // Import transaction from JSON
  function importTx(json: string) {
    try {
      const obj = JSON.parse(json);
      if (obj.tx) {
        currentTxRef.current = obj.tx;
        if (typeof window !== "undefined") {
          localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(obj.tx));
        }
      }
    } catch {
      // Invalid import
    }
  }

  // Kit instance management (unchanged)
  const getKit = (chainId: string, safeAddress: string) => {
    const key: SafeKitKey = `${chainId}:${safeAddress}`;
    return kitCache.current.get(key);
  };

  const setKit = (chainId: string, safeAddress: string, kit: Safe) => {
    const key: SafeKitKey = `${chainId}:${safeAddress}`;
    kitCache.current.set(key, kit);
  };

  return (
    <SafeKitContext.Provider
      value={{
        getKit,
        setKit,
        saveTransaction,
        getTransaction,
        removeTransaction,
        exportCurrentTx,
        importTx,
      }}
    >
      {children}
    </SafeKitContext.Provider>
  );
};

export function useSafeKitContext() {
  const ctx = useContext(SafeKitContext);
  if (!ctx)
    throw new Error("useSafeKitContext must be used within a SafeKitProvider");
  return ctx;
}
