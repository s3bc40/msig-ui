import { useAccount } from "wagmi";
import { useCallback, useEffect, useState, useRef } from "react";
import { useSafeWalletContext } from "../provider/SafeWalletProvider";
import {
  createConnectionConfig,
  createPredictionConfig,
  getMinimalEIP1193Provider,
} from "../utils/helpers";

// Cache for protocolKit instances (per chainId+safeAddress)
import { useSafeKitContext } from "../provider/SafeKitProvider";
import Safe, {
  EthSafeTransaction,
  EthSafeSignature,
  SafeConfig,
} from "@safe-global/protocol-kit";
import { MinimalEIP1193Provider, SafeDeployStep } from "../utils/types";
import { DEFAULT_DEPLOY_STEPS } from "../utils/constants";
import { waitForTransactionReceipt } from "viem/actions";

export default function useSafe(safeAddress: `0x${string}`) {
  const { address: signer, chain, connector } = useAccount();

  const { safeWalletData, contractNetworks, addSafe, removeSafe } =
    useSafeWalletContext();
  const {
    getKit,
    setKit,
    saveTransaction,
    getTransaction,
    saveSignature,
    getSignatures,
  } = useSafeKitContext();

  // Get Safe name from addressBook for current chain
  const chainId = chain?.id ? String(chain.id) : undefined;
  let safeName = "";
  if (
    chainId &&
    safeWalletData.data.addressBook[chainId]?.[safeAddress as `0x${string}`]
  ) {
    safeName =
      safeWalletData.data.addressBook[chainId]?.[safeAddress as `0x${string}`];
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
    chainId &&
    safeWalletData.data.addressBook[chainId]?.[safeAddress as `0x${string}`];
  const undeployedSafe =
    chainId &&
    safeWalletData.data.undeployedSafes[chainId]?.[
      safeAddress as `0x${string}`
    ];

  // Store the current kit instance in a ref
  const kitRef = useRef<Safe>(null);

  // Helper to (re)connect and cache a SafeKit instance
  const connectSafe = useCallback(
    async (
      chainId: string,
      safeAddress: `0x${string}`,
      provider: MinimalEIP1193Provider,
      signer: `0x${string}`,
      setKitFn?: (
        chainId: string,
        safeAddress: `0x${string}`,
        kit: Safe,
      ) => void,
    ): Promise<Safe> => {
      const config: SafeConfig = createConnectionConfig(
        provider,
        signer,
        safeAddress,
        contractNetworks,
      );
      let kit = await Safe.init(config);
      kit = await kit.connect(config);
      if (setKitFn) setKitFn(chainId, safeAddress, kit);
      return kit;
    },
    [contractNetworks],
  );

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
          let kit = getKit(chainId, safeAddress as `0x${string}`);
          if (!kit) {
            kit = await connectSafe(
              chainId,
              safeAddress as `0x${string}`,
              provider,
              signer as `0x${string}`,
              setKit,
            );
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
        } catch (e: unknown) {
          if (e instanceof Error) {
            setError(e.message);
          } else {
            setError("Failed to fetch Safe data from chain");
          }
          setSafeInfo(null);
          kitRef.current = null;
          setIsOwner(false);
          setReadOnly(true);
          setUnavailable(true);
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
    connectSafe,
  ]);

  // Deploy an undeployed Safe using its config from SafeWalletData
  const deployUndeployedSafe = useCallback(
    async (
      setDeploySteps: (steps: Array<SafeDeployStep>) => void,
    ): Promise<Array<SafeDeployStep>> => {
      if (!undeployedSafe || !connector || !signer || !chainId) {
        return [
          {
            step: "txCreated",
            status: "error",
            error: "Missing Safe config, wallet connector, signer, or chainId.",
          },
        ];
      }
      const steps: SafeDeployStep[] = DEFAULT_DEPLOY_STEPS.map((step) => ({
        ...step,
      }));
      try {
        steps[0].status = "running";
        setDeploySteps([...steps]);
        const provider = await getMinimalEIP1193Provider(connector);
        if (!provider) {
          steps[0].status = "error";
          steps[0].error = "No provider found";
          setDeploySteps([...steps]);
          return steps;
        }
        // Build SafeConfig using helper for ProtocolKit compatibility
        const config: SafeConfig = createPredictionConfig(
          provider,
          signer,
          undeployedSafe.props.safeAccountConfig.owners,
          undeployedSafe.props.safeAccountConfig.threshold,
          undeployedSafe.props.saltNonce,
          contractNetworks,
        );
        const kit = await Safe.init(config);
        let deploymentTx, kitClient, txHash;
        try {
          console.log("Creating deployment transaction with config:", config);
          deploymentTx = await kit.createSafeDeploymentTransaction();
          console.log("Deployment transaction created:", deploymentTx);
          kitClient = await kit.getSafeProvider().getExternalSigner();
          steps[0].status = "success";
          steps[1].status = "running";
          setDeploySteps([...steps]);
        } catch (err) {
          steps[0].status = "error";
          steps[0].error = err instanceof Error ? err.message : String(err);
          setDeploySteps([...steps]);
          return steps;
        }
        try {
          txHash = await kitClient!.sendTransaction({
            to: deploymentTx.to as `0x${string}`,
            value: BigInt(deploymentTx.value),
            data: deploymentTx.data as `0x${string}`,
            chain: chain,
          });
          steps[1].status = "success";
          steps[1].txHash = txHash;
          steps[2].status = "running";
          setDeploySteps([...steps]);
        } catch (err) {
          steps[1].status = "error";
          steps[1].error = err instanceof Error ? err.message : String(err);
          setDeploySteps([...steps]);
          return steps;
        }
        try {
          if (txHash) {
            // Wait for confirmation (replace with your preferred method)
            await waitForTransactionReceipt(kitClient!, { hash: txHash });
            steps[2].status = "success";
            steps[2].txHash = txHash;
            steps[3].status = "running";
            setDeploySteps([...steps]);
          }
        } catch (err) {
          steps[2].status = "error";
          steps[2].error = err instanceof Error ? err.message : String(err);
          setDeploySteps([...steps]);
          return steps;
        }
        try {
          const safeAddress = await kit.getAddress();
          const newKit = await kit.connect({ safeAddress });
          const isDeployed = await newKit.isSafeDeployed();
          if (!isDeployed) throw new Error("Safe deployment not detected");
          steps[3].status = "success";
          steps[3].txHash = txHash;
          setDeploySteps([...steps]);
          // Update SafeWalletData: move from undeployed to deployed
          addSafe(chainId, safeAddress as `0x${string}`, safeName);
          removeSafe(chainId, safeAddress as `0x${string}`, false);
        } catch (err) {
          steps[3].status = "error";
          steps[3].error = err instanceof Error ? err.message : String(err);
          steps[3].txHash = txHash;
          setDeploySteps([...steps]);
          return steps;
        }
      } catch (err) {
        steps[0].status = "error";
        steps[0].error = err instanceof Error ? err.message : String(err);
        setDeploySteps([...steps]);
      }
      return steps;
    },
    [
      undeployedSafe,
      connector,
      signer,
      chain,
      chainId,
      addSafe,
      removeSafe,
      safeName,
      contractNetworks,
    ],
  );

  // ProtocolKit helpers
  // Build a SafeTransaction
  const buildSafeTransaction = useCallback(
    async (
      txs: Array<{
        to: string;
        value: string;
        data: string;
        operation?: number;
      }>,
    ): Promise<EthSafeTransaction | null> => {
      const kit = kitRef.current;
      if (!kit) return null;
      try {
        const safeTx = await kit.createTransaction({
          transactions: txs,
        });
        const txHash = await kit.getTransactionHash(safeTx);
        saveTransaction(txHash, safeTx);
        return safeTx;
      } catch (err) {
        console.error("Error building SafeTransaction:", err);
        return null;
      }
    },
    [saveTransaction],
  );

  // Validate a SafeTransaction
  const validateSafeTransaction = useCallback(
    async (safeTx: EthSafeTransaction): Promise<boolean> => {
      const kit = kitRef.current;
      if (!kit) return false;
      return kit.isValidTransaction(safeTx);
    },
    [],
  );

  // Get transaction hash
  const getSafeTransactionHash = useCallback(
    async (safeTx: EthSafeTransaction): Promise<string> => {
      const kit = kitRef.current;
      if (!kit) return "";
      return kit.getTransactionHash(safeTx);
    },
    [],
  );

  // Sign a SafeTransaction
  const signSafeTransaction = useCallback(
    async (safeTx: EthSafeTransaction): Promise<EthSafeTransaction | null> => {
      const kit = kitRef.current;
      if (!kit) return null;
      const signedTx = await kit.signTransaction(safeTx);
      const txHash = await kit.getTransactionHash(safeTx);
      signedTx.signatures.forEach((sig) => saveSignature(txHash, sig));
      saveTransaction(txHash, signedTx);
      return signedTx;
    },
    [saveSignature, saveTransaction],
  );

  // Broadcast a SafeTransaction
  const broadcastSafeTransaction = useCallback(
    async (safeTx: EthSafeTransaction): Promise<unknown | null> => {
      const kit = kitRef.current;
      if (!kit) return null;
      return kit.executeTransaction(safeTx);
    },
    [],
  );

  // Reconstruct SafeTransaction from provider data
  const getSafeTransactionByHash = useCallback(
    async (hash: string): Promise<EthSafeTransaction | null> => {
      console.log("Getting SafeTransaction for hash:", hash);
      console.log("Using safeAddress:", safeAddress, "chainId:", chainId);
      const kit = kitRef.current;
      if (!kit) return null;
      const stored = getTransaction(hash);
      console.log("Stored tx:", stored);
      if (!stored) return null;
      const safeTx = await kit.createTransaction({
        transactions: [stored.data],
      });
      console.log("Reconstructed safeTx:", safeTx);
      const sigs = getSignatures(hash);
      sigs.forEach((sig) =>
        safeTx.addSignature(
          new EthSafeSignature(sig.signer, sig.data, sig.isContractSignature),
        ),
      );
      return safeTx;
    },
    [getTransaction, getSignatures, safeAddress, chainId],
  );

  return {
    safeInfo,
    safeName,
    isLoading,
    error,
    isOwner,
    readOnly,
    unavailable,
    buildSafeTransaction,
    validateSafeTransaction,
    getSafeTransactionHash,
    signSafeTransaction,
    broadcastSafeTransaction,
    getSafeTransactionByHash,
    deployUndeployedSafe,
    addSafe,
    contractNetworks,
    safeWalletData,
    kit: kitRef.current,
  };
}
