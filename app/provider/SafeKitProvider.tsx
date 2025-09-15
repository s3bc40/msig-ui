"use client";
import Safe from "@safe-global/protocol-kit";
import React, { createContext, useContext, useRef } from "react";

// Type for cache key
export type SafeKitKey = `${string}:${string}`; // chainId:safeAddress

// Context type
export interface SafeKitContextType {
  getKit: (chainId: string, safeAddress: string) => Safe | undefined;
  setKit: (chainId: string, safeAddress: string, kit: Safe) => void;
}

const SafeKitContext = createContext<SafeKitContextType | undefined>(undefined);

export const SafeKitProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use a ref to persist cache across renders
  const kitCache = useRef<Map<SafeKitKey, Safe>>(new Map());

  // Get a kit instance
  const getKit = (chainId: string, safeAddress: string) => {
    const key: SafeKitKey = `${chainId}:${safeAddress}`;
    return kitCache.current.get(key);
  };

  // Set a kit instance
  const setKit = (chainId: string, safeAddress: string, kit: Safe) => {
    const key: SafeKitKey = `${chainId}:${safeAddress}`;
    kitCache.current.set(key, kit);
  };

  return (
    <SafeKitContext.Provider value={{ getKit, setKit }}>
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
