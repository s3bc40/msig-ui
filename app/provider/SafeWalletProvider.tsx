"use client";

/**
 * SafeProvider Context for Safe ProtocolKit SDK
 *
 * This context uses React's useCallback to memoize context functions (initSafe, connectSafe, resetSafe).
 * Memoization ensures that the context value remains stable between renders, preventing unnecessary re-renders
 * in consumers and optimizing performance, especially in large or deeply nested React apps.
 *
 * If you refactor this file, keep useCallback for context functions unless you have a specific reason to remove it.
 * For more details, see: https://react.dev/reference/react/useCallback
 */
import React, { createContext, useState, useEffect, useContext } from "react";
import type { SafeWalletData, UndeployedSafe } from "../utils/types";
import { buildContractNetworks } from "../utils/contractNetworks";
import type { ContractNetworks } from "../utils/contractNetworks";
import { useChains } from "wagmi";

// -- Interfaces and Context --
export interface SafeWalletContextType {
  safeWalletData: SafeWalletData;
  setSafeWalletData: React.Dispatch<React.SetStateAction<SafeWalletData>>;
  contractNetworks: ContractNetworks | undefined;
  addSafe: (
    chainId: string,
    safeAddress: string,
    safeName: string,
    safeConfig?: UndeployedSafe,
  ) => void;
  importSafeWalletData: (data: SafeWalletData) => void;
  exportSafeWalletData: () => string;
}

export const SafeWalletContext = createContext<
  SafeWalletContextType | undefined
>(undefined);

// -- Provider Component --

export const SafeWalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Wagmi hooks (if needed for actions)
  const chains = useChains();

  const [contractNetworks, setContractNetworks] = useState<
    ContractNetworks | undefined
  >();

  // Initialize SafeWalletData from localStorage or default
  const defaultSafeWalletData = React.useMemo<SafeWalletData>(
    () => ({
      version: "3.0", // current version?
      data: {
        addressBook: {},
        addedSafes: {},
        undeployedSafes: {},
        visitedSafes: {},
      },
    }),
    [],
  );

  const [safeWalletData, setSafeWalletData] = useState<SafeWalletData>(
    defaultSafeWalletData,
  );

  // Load SafeWalletData from localStorage and build contractNetworks on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("msigWalletData");
      if (stored) {
        try {
          setSafeWalletData(JSON.parse(stored));
        } catch {
          setSafeWalletData(defaultSafeWalletData);
        }
      }
      // Build contractNetworks once chains are available
      const chainIds = chains.map((c) => c.id);
      buildContractNetworks(chainIds)
        .then(setContractNetworks)
        .catch(() => setContractNetworks(undefined));
    }
  }, [defaultSafeWalletData, chains]);

  // Persist SafeWalletData to localStorage on change
  useEffect(() => {
    localStorage.setItem("msigWalletData", JSON.stringify(safeWalletData));
  }, [safeWalletData]);

  const addSafe = (
    chainId: string,
    safeAddress: string,
    safeName: string,
    safeConfig?: UndeployedSafe,
  ) => {
    setSafeWalletData((prev) => {
      const data = { ...prev.data };
      if (safeConfig) {
        if (!data.undeployedSafes[chainId]) data.undeployedSafes[chainId] = {};
        // Only accept UndeployedSafe for undeployed
        data.undeployedSafes[chainId][safeAddress] = safeConfig;
      }
      // Store safe in addressBook with name
      if (!data.addressBook[chainId]) data.addressBook[chainId] = {};
      data.addressBook[chainId][safeAddress] = safeName;
      return { ...prev, data };
    });
  };

  // const removeSafe = (
  //   chainId: string,
  //   safeAddress: string,
  //   deployed = false,
  // ) => {
  //   setSafeWalletData((prev) => {
  //     const data = { ...prev.data };
  //     if (deployed) {
  //       if (data.addressBook[chainId]) {
  //         delete data.addressBook[chainId][safeAddress];
  //       }
  //     } else {
  //       if (data.undeployedSafes[chainId]) {
  //         delete data.undeployedSafes[chainId][safeAddress];
  //       }
  //     }
  //     return { ...prev, data };
  //   });
  // };

  const importSafeWalletData = (data: SafeWalletData) => {
    setSafeWalletData(data);
  };

  const exportSafeWalletData = () => {
    return JSON.stringify(safeWalletData, null, 2);
  };

  return (
    <SafeWalletContext.Provider
      value={{
        safeWalletData,
        setSafeWalletData,
        contractNetworks,
        addSafe,
        importSafeWalletData,
        exportSafeWalletData,
      }}
    >
      {children}
    </SafeWalletContext.Provider>
  );
};

export function useSafeWalletContext() {
  const ctx = useContext(SafeWalletContext);
  if (!ctx)
    throw new Error(
      "useSafeWalletContext must be used within a SafeWalletProvider",
    );
  return ctx;
}
