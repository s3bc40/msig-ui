import { useAccount } from "wagmi";
import { useCallback, useEffect, useState } from "react";
import { useSafeWalletContext } from "../provider/SafeWalletProvider";

export default function useSafe(safeAddress: `0x${string}`) {
  const { address: signer, chain } = useAccount();
  const { safeWalletData, contractNetworks, addSafe, removeSafe, updateSafe } =
    useSafeWalletContext();

  const [safeInfo, setSafeInfo] = useState<{
    owners: `0x${string}`[];
    balance: bigint;
    threshold: number;
    version: string;
    chainId: string;
    deployed: boolean;
    undeployedConfig?: Record<string, unknown>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [readOnly, setReadOnly] = useState(true);

  // Get Safe info from context
  const chainId = chain?.id ? String(chain.id) : undefined;
  const deployedSafe =
    chainId && safeWalletData.data.addedSafes[chainId]?.[safeAddress];
  const undeployedSafe =
    chainId && safeWalletData.data.undeployedSafes[chainId]?.[safeAddress];

  // Fetch SafeInfo from context
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    if (!safeAddress || !chainId) {
      setSafeInfo(null);
      setIsLoading(false);
      return;
    }
    if (deployedSafe) {
      setSafeInfo({
        owners: deployedSafe.owners as `0x${string}`[],
        balance: BigInt(0),
        threshold: deployedSafe.threshold,
        version: "1.4.1",
        chainId,
        deployed: true,
      });
      setIsOwner(deployedSafe.owners.includes(signer as `0x${string}`));
      setReadOnly(!deployedSafe.owners.includes(signer as `0x${string}`));
    } else if (undeployedSafe) {
      setSafeInfo({
        owners: undeployedSafe.props.safeAccountConfig
          .owners as `0x${string}`[],
        balance: BigInt(0),
        threshold: undeployedSafe.props.safeAccountConfig.threshold,
        version: undeployedSafe.props.safeVersion || "1.4.1",
        chainId,
        deployed: false,
        undeployedConfig: undeployedSafe.props,
      });
      setIsOwner(
        undeployedSafe.props.safeAccountConfig.owners.includes(
          signer as `0x${string}`,
        ),
      );
      setReadOnly(
        !undeployedSafe.props.safeAccountConfig.owners.includes(
          signer as `0x${string}`,
        ),
      );
    } else {
      setSafeInfo(null);
      setIsOwner(false);
      setReadOnly(true);
    }
    setIsLoading(false);
  }, [
    safeAddress,
    chainId,
    signer,
    safeWalletData,
    deployedSafe,
    undeployedSafe,
  ]);

  // Connect to Safe: placeholder for future logic
  const connectSafe = useCallback(async () => {
    // You can implement actual connection logic here if needed
    return;
  }, []);

  // Example transaction helpers (placeholders)
  const buildTransaction = useCallback(
    async (_txData: {
      to: `0x${string}`;
      value: bigint;
      data: `0x${string}`;
    }) => {
      // ...build transaction logic using protocol kit...
      // return tx object
    },
    [],
  );

  const signTransaction = useCallback(async (_tx: unknown) => {
    // ...sign transaction logic...
  }, []);

  const broadcastTransaction = useCallback(async (_signedTx: unknown) => {
    // ...broadcast transaction logic...
  }, []);

  return {
    safeInfo,
    isLoading,
    error,
    isOwner,
    readOnly,
    buildTransaction,
    signTransaction,
    broadcastTransaction,
    connectSafe,
    addSafe,
    removeSafe,
    updateSafe,
    contractNetworks,
    safeWalletData,
  };
}
