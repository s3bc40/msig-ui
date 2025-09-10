import { useState, useEffect, useCallback } from "react";
import { useSafeContext } from "@/app/hooks/useSafeContext";
import { Chain } from "viem";

/**
 * useSafeAccount - Composable hook for Safe details and transaction actions
 *
 * This hook composes useSafeContext to access the current protocol kit and connection state.
 * It fetches Safe details (owners, balance, threshold, version) and exposes transaction helpers.
 *
 * Composing hooks is a recommended React pattern for modularity and code reuse.
 * See: https://react.dev/learn/reusing-logic-with-custom-hooks
 */
export function useSafeAccount(address?: `0x${string}`, chain?: Chain) {
  const { currentProtcolKit, isConnecting } = useSafeContext();
  const [safeInfo, setSafeInfo] = useState<{
    owners: `0x${string}`[];
    balance: bigint;
    threshold: number;
    version: string;
  } | null>(null);
  const [isDeployed, setIsDeployed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch deployment status first, then Safe details if deployed
  useEffect(() => {
    async function fetchDetails() {
      if (!currentProtcolKit || !address || !chain) return;
      setIsLoading(true);
      setError(null);
      try {
        const kit = await currentProtcolKit.connect({ safeAddress: address });
        const deployed = await kit.isSafeDeployed();
        setIsDeployed(deployed);
        if (deployed) {
          const [owners, balance, threshold, version] = await Promise.all([
            kit.getOwners(),
            kit.getBalance(),
            kit.getThreshold(),
            kit.getContractVersion(),
          ]);
          setSafeInfo({
            owners: owners as `0x${string}`[],
            balance,
            threshold,
            version: String(version),
          });
        } else {
          setSafeInfo(null);
        }
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : "Failed to fetch Safe details",
        );
        setIsDeployed(null);
        setSafeInfo(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDetails();
  }, [currentProtcolKit, address, chain]);

  // Example transaction helpers
  const buildTransaction = useCallback(
    async (txData: {
      to: `0x${string}`;
      value: bigint;
      data: `0x${string}`;
    }) => {
      if (!currentProtcolKit || !address) throw new Error("Safe not connected");
      // ...build transaction logic using protocol kit...
      // return tx object
    },
    [currentProtcolKit, address],
  );

  const signTransaction = useCallback(
    async (tx: any) => {
      if (!currentProtcolKit) throw new Error("Safe not connected");
      // ...sign transaction logic...
    },
    [currentProtcolKit],
  );

  const broadcastTransaction = useCallback(
    async (signedTx: any) => {
      if (!currentProtcolKit) throw new Error("Safe not connected");
      // ...broadcast transaction logic...
    },
    [currentProtcolKit],
  );

  return {
    safeInfo,
    isDeployed,
    isLoading,
    error,
    buildTransaction,
    signTransaction,
    broadcastTransaction,
    isConnecting,
  };
}
