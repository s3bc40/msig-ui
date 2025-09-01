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
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import Safe, { SafeConfig, ConnectSafeConfig } from "@safe-global/protocol-kit";

interface SafeContextType {
  protocolKit: Safe | null;
  safeAddress: string | null;
  isLoading: boolean;
  error: string | null;
  initSafe: (args: SafeConfig) => Promise<void>;
  connectSafe: (args: ConnectSafeConfig) => Promise<void>;
  resetSafe: () => void;
}

const SafeContext = createContext<SafeContextType | undefined>(undefined);

export const SafeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Store the Safe SDK instance
  const [protocolKit, setProtocolKit] = useState<Safe | null>(null);
  const [safeAddress, setSafeAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist safeAddress in localStorage
  useEffect(() => {
    if (safeAddress) {
      localStorage.setItem("safeAddress", safeAddress);
    } else {
      localStorage.removeItem("safeAddress");
    }
  }, [safeAddress]);

  // Restore safeAddress on load
  useEffect(() => {
    const stored = localStorage.getItem("safeAddress");
    if (stored) setSafeAddress(stored);
  }, []);

  /**
   * Initialize a new Safe instance (for deployment or prediction)
   * Usage example:
   *   await initSafe({ provider, signer, predictedSafe, isL1SafeSingleton, contractNetworks })
   */
  const initSafe = useCallback(async (args: SafeConfig) => {
    setIsLoading(true);
    setError(null);
    try {
      const kit = await Safe.init(args);
      setProtocolKit(kit);
      // Get address from SDK instance
      if (kit.getAddress) setSafeAddress(await kit.getAddress());
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Failed to initialize Safe");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Connect to an existing Safe instance
   * Usage example:
   *   await connectSafe({ signer, safeAddress })
   *   or
   *   await connectSafe({ signer, predictedSafe })
   */
  const connectSafe = useCallback(
    async (args: ConnectSafeConfig) => {
      setIsLoading(true);
      setError(null);
      try {
        if (!protocolKit) throw new Error("ProtocolKit not initialized");
        const newKit = await protocolKit.connect(args);
        setProtocolKit(newKit);
        // Get address from args if provided, else from SDK instance
        if (args.safeAddress) {
          setSafeAddress(args.safeAddress);
        } else if (newKit.getAddress) {
          setSafeAddress(await newKit.getAddress());
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Failed to connect Safe");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [protocolKit],
  );

  const resetSafe = useCallback(() => {
    setProtocolKit(null);
    setSafeAddress(null);
    setError(null);
    setIsLoading(false);
    localStorage.removeItem("safeAddress");
  }, []);

  return (
    <SafeContext.Provider
      value={{
        protocolKit,
        safeAddress,
        isLoading,
        error,
        initSafe,
        connectSafe,
        resetSafe,
      }}
    >
      {children}
    </SafeContext.Provider>
  );
};

export function useSafe() {
  const ctx = useContext(SafeContext);
  if (!ctx) throw new Error("useSafe must be used within a SafeProvider");
  return ctx;
}
