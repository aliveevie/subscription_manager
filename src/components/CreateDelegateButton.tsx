import { useGatorContext } from "@/hooks/useGatorContext";
import { useState } from "react";
import { useStepContext } from "@/hooks/useStepContext";
import { useAccountAbstractionUtils } from "@/hooks/useAccountAbstractionUtils";
import { useChainId } from "wagmi";
import "./ButtonStyles.css";

interface CreateDelegateButtonProps {
  onSuccess?: () => void;
}

export default function CreateDelegateButton({ onSuccess }: CreateDelegateButtonProps) {
  const { generateDelegateWallet } = useGatorContext();
  const { changeStep } = useStepContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { 
    isCorrectNetwork, 
    switchToSepolia, 
    isNetworkSwitching,
    targetChain 
  } = useAccountAbstractionUtils();
  const chainId = useChainId();

  const handleCreateDelegate = async () => {
    // Check if we're on the correct network first
    if (!isCorrectNetwork) {
      setError(`Please switch to the Sepolia network (Chain ID: ${targetChain.id})`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Generate delegate wallet
      await generateDelegateWallet();
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default behavior if no callback provided
        changeStep(4);
      }
    } catch (err) {
      console.error("Error creating delegate wallet:", err);
      setError(`Failed to create delegate wallet: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleNetworkSwitch = async () => {
    try {
      await switchToSepolia();
    } catch (err) {
      console.error("Error switching network:", err);
      setError(`Failed to switch network: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="delegate-button-container">
      {error && <div className="error-message">{error}</div>}
      
      {!isCorrectNetwork ? (
        <>
          <div className="network-warning">
            <p>You're currently on network with Chain ID: {chainId}.</p>
            <p>This application requires the Sepolia test network (Chain ID: {targetChain.id}).</p>
          </div>
          <button 
            className="button network-button" 
            onClick={handleNetworkSwitch}
            disabled={isNetworkSwitching}
          >
            {isNetworkSwitching ? "Switching Network..." : "Switch to Sepolia Network"}
          </button>
        </>
      ) : (
        <>
          <button 
            className="button" 
            onClick={handleCreateDelegate}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Delegate Wallet"}
          </button>
          {loading && <div className="loading-message">This may take a moment. Please don't close this page.</div>}
        </>
      )}
    </div>
  );
}
