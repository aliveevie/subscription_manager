import {
  Implementation,
  MetaMaskSmartAccount,
  toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";
import { useEffect, useState } from "react";
import { privateKeyToAccount } from "viem/accounts";
import { usePublicClient, useChainId } from "wagmi";
import { sepolia } from "viem/chains";
import { useGatorContext } from "@/hooks/useGatorContext";
import { useAccountAbstractionUtils } from "./useAccountAbstractionUtils";

export default function useDelegateSmartAccount(): {
  smartAccount: MetaMaskSmartAccount | null;
  isCorrectNetwork: boolean;
} {
  const { delegateWallet } = useGatorContext();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { isCorrectNetwork } = useAccountAbstractionUtils();

  const [smartAccount, setSmartAccount] = useState<MetaMaskSmartAccount | null>(
    null
  );

  useEffect(() => {
    // Clear smart account when network changes to avoid chain ID mismatches
    if (!isCorrectNetwork && smartAccount) {
      console.log("Network changed, clearing delegate smart account");
      setSmartAccount(null);
      return;
    }
    
    // Only create smart account when on the correct network and we have a delegate wallet
    if (delegateWallet === "0x" || !publicClient || !isCorrectNetwork) return;

    console.log("Creating delegate smart account on Sepolia");
    
    try {
      // Ensure we're using the correct chain ID
      if (publicClient.chain.id !== sepolia.id) {
        console.log(`Chain ID mismatch for delegate: Expected ${sepolia.id}, got ${publicClient.chain.id}`);
        return;
      }
      
      const account = privateKeyToAccount(delegateWallet as `0x${string}`);

      toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [account.address, [], [], []],
        deploySalt: "0x",
        signatory: { account },
      }).then((smartAccount) => {
        setSmartAccount(smartAccount);
      }).catch((err) => {
        console.error("Error creating delegate smart account:", err);
        setSmartAccount(null);
      });
    } catch (err) {
      console.error("Exception creating delegate smart account:", err);
      setSmartAccount(null);
    }
  }, [delegateWallet, publicClient, chainId, isCorrectNetwork]);

  return { smartAccount, isCorrectNetwork };
}
