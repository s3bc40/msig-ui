"use client";
import Safe, {
  EthSafeTransaction,
  EthSafeSignature,
} from "@safe-global/protocol-kit";
import React, { createContext, useContext, useRef } from "react";

// Type for cache key
export type SafeKitKey = `${string}:${string}`; // chainId:safeAddress

// Context type
type StoredSafeTx = {
  data: EthSafeTransaction["data"];
  signatures: Array<{
    signer: string;
    data: string;
    isContractSignature: boolean;
  }>;
};

export interface SafeKitContextType {
  getKit: (chainId: string, safeAddress: string) => Safe | undefined;
  setKit: (chainId: string, safeAddress: string, kit: Safe) => void;
  saveTransaction: (hash: string, txObj: EthSafeTransaction) => void;
  getTransaction: (hash: string) => StoredSafeTx | undefined;
  removeTransaction: (hash: string) => void;
  listTransactions: (safeAddress: string) => StoredSafeTx[];
  saveSignature: (hash: string, signature: EthSafeSignature) => void;
  getSignatures: (hash: string) => EthSafeSignature[];
}

const SafeKitContext = createContext<SafeKitContextType | undefined>(undefined);

export const SafeKitProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use a ref to persist cache across renders
  const kitCache = useRef<Map<SafeKitKey, Safe>>(new Map());

  // LocalStorage keys
  const TX_STORAGE_KEY = "safeTxs";
  const SIG_STORAGE_KEY = "safeTxSignatures";

  // Helper: load transactions from localStorage
  function loadTxs(): Record<string, StoredSafeTx> {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(TX_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  // Helper: load signatures from localStorage
  function loadSigs(): Record<string, EthSafeSignature[]> {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(SIG_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  // Save transaction by hash
  function saveTransaction(hash: string, txObj: EthSafeTransaction) {
    const txs = loadTxs();
    txs[hash] = {
      data: txObj.data,
      signatures: Array.from(txObj.signatures.values()).map((sig) => ({
        signer: sig.signer,
        data: sig.data,
        isContractSignature: sig.isContractSignature,
      })),
    };
    localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(txs));
  }

  // Get transaction by hash
  function getTransaction(hash: string): StoredSafeTx | undefined {
    const txs = loadTxs();
    if (!txs[hash]) return undefined;
    // Reconstruct EthSafeTransaction (requires ProtocolKit instance)
    // Only return plain data for now; actual reconstruction should be done in useSafe.ts
    return txs[hash];
  }

  // Remove transaction by hash
  function removeTransaction(hash: string) {
    const txs = loadTxs();
    delete txs[hash];
    localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(txs));
  }

  // List transactions for a Safe address
  function listTransactions(safeAddress: string): StoredSafeTx[] {
    const txs = loadTxs();
    // Filter by 'to' address in tx data
    return Object.values(txs).filter((tx) => {
      return tx.data?.to === safeAddress;
    });
  }

  // Save signature for a transaction hash
  function saveSignature(hash: string, signature: EthSafeSignature) {
    const sigs = loadSigs();
    if (!sigs[hash]) sigs[hash] = [];
    // Avoid duplicate signatures
    if (!sigs[hash].some((s) => s.signer === signature.signer)) {
      sigs[hash].push(signature);
      localStorage.setItem(SIG_STORAGE_KEY, JSON.stringify(sigs));
    }
  }

  // Get signatures for a transaction hash
  function getSignatures(hash: string): EthSafeSignature[] {
    const sigs = loadSigs();
    return sigs[hash] || [];
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
        listTransactions,
        saveSignature,
        getSignatures,
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
