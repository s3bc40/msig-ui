import { useAccount } from "wagmi";
import { useCallback, useEffect, useState, useRef } from "react";
import { useSafeWalletContext } from "../provider/SafeWalletProvider";
import {
  createConnectionConfig,
  getMinimalEIP1193Provider,
} from "../utils/helpers";
import Safe, { SafeConfig } from "@safe-global/protocol-kit";

// Cache for protocolKit instances (per chainId+safeAddress)
import { useSafeKitContext } from "../provider/SafeKitProvider";

export default function useSafe(safeAddress: `0x${string}`) {
  const { address: signer, chain, connector } = useAccount();
  const { safeWalletData, contractNetworks, addSafe } = useSafeWalletContext();
  const { getKit, setKit } = useSafeKitContext();

  // Get Safe name from addressBook for current chain
  const chainId = chain?.id ? String(chain.id) : undefined;
  let safeName = "";
  if (chainId && safeWalletData.data.addressBook[chainId]?.[safeAddress]) {
    safeName = safeWalletData.data.addressBook[chainId]?.[safeAddress];
  }

  const [safeInfo, setSafeInfo] = useState<{
    owners: `0x${string}`[];
    balance: bigint;
    threshold: number;
    version: string;
    chainId: string;
    deployed: boolean;
    nonce: number;
    undeployedConfig?: Record<string, unknown>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [readOnly, setReadOnly] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  // Get Safe info from context
  const deployedSafe =
    chainId && safeWalletData.data.addressBook[chainId]?.[safeAddress];
  const undeployedSafe =
    chainId && safeWalletData.data.undeployedSafes[chainId]?.[safeAddress];

  // Store the current kit instance in a ref
  const kitRef = useRef<Safe>(null);

  // Effect 1: Fetch Safe info from blockchain or local context
  useEffect(() => {
    let cancelled = false;
    async function fetchSafeInfo() {
      setIsLoading(true);
      setError(null);
      if (!safeAddress || !chainId) {
        setSafeInfo(null);
        kitRef.current = null;
        setIsOwner(false);
        setReadOnly(true);
        setUnavailable(true);
        setIsLoading(false);
        return;
      }
      if (undeployedSafe) {
        setSafeInfo({
          owners: undeployedSafe.props.safeAccountConfig
            .owners as `0x${string}`[],
          balance: BigInt(0),
          threshold: undeployedSafe.props.safeAccountConfig.threshold,
          version: undeployedSafe.props.safeVersion || "1.4.1",
          chainId,
          deployed: false,
          nonce: 0,
          undeployedConfig: undeployedSafe.props,
        });
        kitRef.current = null;
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
        setUnavailable(false);
      } else if (deployedSafe) {
        try {
          const provider = await getMinimalEIP1193Provider(connector);
          if (!provider) throw new Error("No provider available");
          let kit = getKit(chainId, safeAddress);
          if (!kit) {
            const config: SafeConfig = createConnectionConfig(
              provider,
              signer,
              safeAddress,
              contractNetworks,
            );
            kit = await Safe.init(config);
            kit = await kit.connect(config);
            setKit(chainId, safeAddress, kit);
          }
          kitRef.current = kit;
          const [owners, threshold, version, balance, nonce] =
            await Promise.all([
              kit.getOwners(),
              kit.getThreshold(),
              kit.getContractVersion(),
              kit.getBalance(),
              kit.getNonce(),
            ]);
          if (cancelled) return;
          setSafeInfo({
            owners: owners as `0x${string}`[],
            balance: BigInt(balance),
            threshold,
            version,
            chainId,
            deployed: true,
            nonce,
          });
          setIsOwner(await kit.isOwner(signer as `0x${string}`));
          setReadOnly(!(await kit.isOwner(signer as `0x${string}`)));
          setUnavailable(false);
        } catch {
          setError("Failed to fetch Safe data from chain");
          setSafeInfo(null);
          kitRef.current = null;
          setIsOwner(false);
          setReadOnly(true);
        }
      } else {
        setSafeInfo(null);
        kitRef.current = null;
        setIsOwner(false);
        setReadOnly(true);
        setUnavailable(true);
      }
      setIsLoading(false);
    }
    fetchSafeInfo();
    return () => {
      cancelled = true;
    };
  }, [
    safeAddress,
    chainId,
    signer,
    deployedSafe,
    undeployedSafe,
    contractNetworks,
    connector,
    getKit,
    setKit,
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
    safeName,
    isLoading,
    error,
    isOwner,
    readOnly,
    unavailable,
    buildTransaction,
    signTransaction,
    broadcastTransaction,
    connectSafe,
    addSafe,
    contractNetworks,
    safeWalletData,
    kit: kitRef.current,
  };
}
