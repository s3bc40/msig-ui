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
import { SafeWalletData, SafeConfigData } from "../utils/types";

// -- Interfaces and Context --
interface SafeWalletContextType {
  safeWalletData: SafeWalletData;
  setSafeWalletData: React.Dispatch<React.SetStateAction<SafeWalletData>>;
  addSafe: (
    chainId: string,
    safeAddress: string,
    safeConfig: SafeConfigData,
    deployed?: boolean,
  ) => void;
  removeSafe: (
    chainId: string,
    safeAddress: string,
    deployed?: boolean,
  ) => void;
  updateSafe: (
    chainId: string,
    safeAddress: string,
    update: Partial<SafeConfigData>,
    deployed?: boolean,
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
  // const { address: signer, connector, chain } = useAccount();

  // Initialize SafeWalletData from localStorage or default
  const defaultSafeWalletData = React.useMemo<SafeWalletData>(
    () => ({
      version: "3.0",
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

  // Load SafeWalletData from localStorage on mount
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
    }
  }, [defaultSafeWalletData]);

  // Persist SafeWalletData to localStorage on change
  useEffect(() => {
    localStorage.setItem("msigWalletData", JSON.stringify(safeWalletData));
  }, [safeWalletData]);

  const addSafe = (
    chainId: string,
    safeAddress: string,
    safeConfig: SafeConfigData,
    deployed = false,
  ) => {
    setSafeWalletData((prev) => {
      const data = { ...prev.data };
      if (deployed) {
        if (!data.addedSafes[chainId]) data.addedSafes[chainId] = {};
        data.addedSafes[chainId][safeAddress] = {
          owners: safeConfig.props.safeAccountConfig.owners,
          threshold: safeConfig.props.safeAccountConfig.threshold,
        };
      } else {
        if (!data.undeployedSafes[chainId]) data.undeployedSafes[chainId] = {};
        data.undeployedSafes[chainId][safeAddress] = safeConfig;
      }
      return { ...prev, data };
    });
  };

  const removeSafe = (
    chainId: string,
    safeAddress: string,
    deployed = false,
  ) => {
    setSafeWalletData((prev) => {
      const data = { ...prev.data };
      if (deployed) {
        if (data.addedSafes[chainId]) {
          delete data.addedSafes[chainId][safeAddress];
        }
      } else {
        if (data.undeployedSafes[chainId]) {
          delete data.undeployedSafes[chainId][safeAddress];
        }
      }
      return { ...prev, data };
    });
  };

  const updateSafe = (
    chainId: string,
    safeAddress: string,
    update: Partial<SafeConfigData>,
    deployed = false,
  ) => {
    setSafeWalletData((prev) => {
      const data = { ...prev.data };
      if (deployed) {
        if (data.addedSafes[chainId] && data.addedSafes[chainId][safeAddress]) {
          if (update.props?.safeAccountConfig.owners) {
            data.addedSafes[chainId][safeAddress].owners =
              update.props.safeAccountConfig.owners;
          }
          if (update.props?.safeAccountConfig.threshold) {
            data.addedSafes[chainId][safeAddress].threshold =
              update.props.safeAccountConfig.threshold;
          }
        }
      } else {
        if (
          data.undeployedSafes[chainId] &&
          data.undeployedSafes[chainId][safeAddress]
        ) {
          data.undeployedSafes[chainId][safeAddress] = {
            ...data.undeployedSafes[chainId][safeAddress],
            ...update,
            props: {
              ...data.undeployedSafes[chainId][safeAddress].props,
              ...update.props,
              safeAccountConfig: {
                ...data.undeployedSafes[chainId][safeAddress].props
                  .safeAccountConfig,
                ...update.props?.safeAccountConfig,
              },
            },
          };
        }
      }
      return { ...prev, data };
    });
  };

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
        addSafe,
        removeSafe,
        updateSafe,
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
