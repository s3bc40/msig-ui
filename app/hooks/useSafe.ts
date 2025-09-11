import { useAccount } from "wagmi";
import { useSafeContext } from "../provider/SafeProvider";
import Safe, { SafeConfig } from "@safe-global/protocol-kit";
import { useCallback, useEffect, useState } from "react";
import { getMinimalEIP1193Provider } from "../utils/helpers";

export default function useSafe(safeAddress: `0x${string}`) {
  const { address: signer, chain, connector } = useAccount();
  const { protocolKits, setProtocolKits, setLastSafe, isConnecting } =
    useSafeContext();

  const [safeInfo, setSafeInfo] = useState<{
    owners: `0x${string}`[];
    balance: bigint;
    threshold: number;
    version: string;
  } | null>(null);
  const [isDeployed, setIsDeployed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always use context as the source of truth for SafeKit
  const safeKit =
    safeAddress && chain && protocolKits[safeAddress]?.[chain.id]
      ? protocolKits[safeAddress][chain.id]
      : undefined;

  // Fetch SafeInfo when kit changes
  useEffect(() => {
    async function fetchDetails() {
      if (!safeKit || !safeAddress) return;
      setIsLoading(true);
      setError(null);
      try {
        const deployed = await safeKit.isSafeDeployed();
        setIsDeployed(deployed);
        if (deployed) {
          const [owners, balance, threshold, version] = await Promise.all([
            safeKit.getOwners(),
            safeKit.getBalance(),
            safeKit.getThreshold(),
            safeKit.getContractVersion(),
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
  }, [safeKit, safeAddress]);

  // Connect to Safe on chainId change
  const connectSafe = useCallback(async () => {
    if (!safeAddress || !chain?.id) return;
    // If kit exists, use it
    if (protocolKits[safeAddress]?.[chain.id]) {
      setLastSafe(safeAddress);
      return;
    }
    // Otherwise, get config from predicted safe
    try {
      // Use the first available kit for this safeAddress
      const existingKit =
        protocolKits[safeAddress] &&
        Object.values(protocolKits[safeAddress])[0];
      if (!existingKit) throw new Error("No kit available for prediction");
      const provider = await getMinimalEIP1193Provider(connector, chain.id);
      if (!provider) throw new Error("Provider not available");
      const predictSafeConfig = existingKit.getPredictedSafe();
      if (!predictSafeConfig) throw new Error("No safe config available");

      const config: SafeConfig = {
        provider,
        signer,
        ...predictSafeConfig,
        safeAddress,
      };
      const kit = await Safe.init(config);
      // Check if predicted address matches
      const predictedAddress = await kit.getAddress();
      if (predictedAddress.toLowerCase() !== safeAddress.toLowerCase()) {
        throw new Error("Predicted address does not match");
      }
      const connectedKit = await kit.connect({ safeAddress });
      setProtocolKits((prev) => ({
        ...prev,
        [safeAddress]: {
          ...(prev[safeAddress] || {}),
          [chain.id]: connectedKit,
        },
      }));
      setLastSafe(safeAddress);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to connect Safe");
    }
  }, [safeAddress, signer, chain, protocolKits, setProtocolKits, setLastSafe]);

  // Example transaction helpers
  const buildTransaction = useCallback(
    async (txData: {
      to: `0x${string}`;
      value: bigint;
      data: `0x${string}`;
    }) => {
      if (!safeKit || !safeAddress) throw new Error("Safe not connected");
      // ...build transaction logic using protocol kit...
      // return tx object
    },
    [safeKit, safeAddress],
  );

  const signTransaction = useCallback(
    async (tx: any) => {
      if (!safeKit) throw new Error("Safe not connected");
      // ...sign transaction logic...
    },
    [safeKit],
  );

  const broadcastTransaction = useCallback(
    async (signedTx: any) => {
      if (!safeKit) throw new Error("Safe not connected");
      // ...broadcast transaction logic...
    },
    [safeKit],
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
    connectSafe,
  };
}
