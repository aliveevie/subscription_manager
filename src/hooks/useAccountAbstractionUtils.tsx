import {
  createPimlicoClient,
  PimlicoClient,
} from "permissionless/clients/pimlico";
import { useEffect, useState } from "react";
import { http } from "viem";
import {
  BundlerClient,
  createBundlerClient,
  createPaymasterClient,
  PaymasterClient,
} from "viem/account-abstraction";
import { useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "viem/chains";

export function useAccountAbstractionUtils() {
  const [paymasterClient, setPaymasterClient] = useState<PaymasterClient>();
  const [bundlerClient, setBundlerClient] = useState<BundlerClient>();
  const [pimlicoClient, setPimlicoClient] = useState<PimlicoClient>();
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  
  // We're using Sepolia for this application
  const targetChainId = sepolia.id;
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  // Check if we're on the correct network
  useEffect(() => {
    setIsCorrectNetwork(currentChainId === targetChainId);
  }, [currentChainId, targetChainId]);
  
  // Function to switch to Sepolia
  const switchToSepolia = async () => {
    try {
      setIsNetworkSwitching(true);
      setNetworkError(null);
      await switchChain({ chainId: targetChainId });
    } catch (error) {
      console.error("Error switching to Sepolia:", error);
      setNetworkError(`Failed to switch to Sepolia: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsNetworkSwitching(false);
    }
  };

  // Initialize clients when on the correct network
  useEffect(() => {
    if (!isCorrectNetwork) return;
    
    const pimlicoKey = import.meta.env.VITE_PIMLICO_API_KEY;

    if (!pimlicoKey) {
      console.error("Pimlico API key is not set");
      return;
    }

    try {
      // Always use the Sepolia chain ID for our services
      const sepoliaChainId = sepolia.id;
      
      const bundlerClient = createBundlerClient({
        transport: http(
          `https://api.pimlico.io/v2/${sepoliaChainId}/rpc?apikey=${pimlicoKey}`
        ),
      });

      const paymasterClient = createPaymasterClient({
        transport: http(
          `https://api.pimlico.io/v2/${sepoliaChainId}/rpc?apikey=${pimlicoKey}`
        ),
      });

      const pimlicoClient = createPimlicoClient({
        transport: http(
          `https://api.pimlico.io/v2/${sepoliaChainId}/rpc?apikey=${pimlicoKey}`
        ),
      });

      setPimlicoClient(pimlicoClient);
      setBundlerClient(bundlerClient);
      setPaymasterClient(paymasterClient);
    } catch (error) {
      console.error("Error initializing clients:", error);
    }
  }, [isCorrectNetwork]);

  return { 
    bundlerClient, 
    paymasterClient, 
    pimlicoClient, 
    isCorrectNetwork, 
    switchToSepolia, 
    isNetworkSwitching,
    networkError,
    targetChain: sepolia
  };
}
