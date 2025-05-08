import {
  Implementation,
  MetaMaskSmartAccount,
  toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";
import { useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient, useChainId } from "wagmi";
import { sepolia } from "viem/chains";
import { useAccountAbstractionUtils } from "./useAccountAbstractionUtils";

export default function useDelegatorSmartAccount(): {
  smartAccount: MetaMaskSmartAccount | null;
  isCorrectNetwork: boolean;
} {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { isCorrectNetwork } = useAccountAbstractionUtils();
  const [smartAccount, setSmartAccount] = useState<MetaMaskSmartAccount | null>(
    null
  );
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Clear smart account when network changes to avoid chain ID mismatches
    if (!isCorrectNetwork && smartAccount) {
      console.log("Network changed, clearing smart account");
      setSmartAccount(null);
      return;
    }
    
    // Only create smart account when on the correct network
    if (!address || !walletClient || !publicClient || !isCorrectNetwork) return;

    console.log("Creating smart account on Sepolia");
    
    try {
      // Ensure we're using the correct chain ID
      if (publicClient.chain.id !== sepolia.id) {
        console.log(`Chain ID mismatch: Expected ${sepolia.id}, got ${publicClient.chain.id}`);
        return;
      }
      
      toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [address, [], [], []],
        deploySalt: "0x",
        signatory: { walletClient },
      }).then((smartAccount) => {
        setSmartAccount(smartAccount);
        setError(null);
      }).catch((err) => {
        console.error("Error creating smart account:", err);
        setError(err);
        setSmartAccount(null);
      });
    } catch (err) {
      console.error("Exception creating smart account:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setSmartAccount(null);
    }
  }, [address, walletClient, publicClient, chainId, isCorrectNetwork]);

  return { smartAccount, isCorrectNetwork };
}
