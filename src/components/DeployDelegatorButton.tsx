import { useAccountAbstractionUtils } from "@/hooks/useAccountAbstractionUtils";
import useDelegatorSmartAccount from "@/hooks/useDelegatorSmartAccount";
import { useStepContext } from "@/hooks/useStepContext";
import { useState } from "react";
import { zeroAddress } from "viem";
import { useChainId } from "wagmi";
import "./ButtonStyles.css";

interface DeployDelegatorButtonProps {
  onSuccess?: () => void;
}

export default function DeployDelegatorButton({ onSuccess }: DeployDelegatorButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { smartAccount } = useDelegatorSmartAccount();
  const { changeStep } = useStepContext();
  const { 
    bundlerClient, 
    paymasterClient, 
    pimlicoClient, 
    isCorrectNetwork,
    switchToSepolia,
    isNetworkSwitching,
    targetChain
  } = useAccountAbstractionUtils();
  const chainId = useChainId();

  const handleDeployDelegator = async () => {
    // Check if we're on the correct network first
    if (!isCorrectNetwork) {
      setError(`Please switch to the Sepolia network (Chain ID: ${targetChain.id})`);
      return;
    }
    
    if (!smartAccount) {
      setError("Smart account not initialized");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get gas price from Pimlico
      const { fast: fee } = await pimlicoClient!.getUserOperationGasPrice();

      // Send user operation to deploy the account
      const userOperationHash = await bundlerClient!.sendUserOperation({
        account: smartAccount,
        calls: [
          {
            to: zeroAddress,
          },
        ],
        paymaster: paymasterClient,
        ...fee,
      });

      // Wait for the receipt
      const { receipt } = await bundlerClient!.waitForUserOperationReceipt({
        hash: userOperationHash,
      });

      console.log("Deployment successful:", receipt);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default behavior if no callback provided
        changeStep(3);
      }
    } catch (err) {
      console.error("Error deploying delegator account:", err);
      setError(`Deployment failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
    <div className="deploy-button-container">
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
            onClick={handleDeployDelegator}
            disabled={loading || !smartAccount}
          >
            {loading ? "Deploying..." : "Deploy Delegator Account"}
          </button>
          {loading && <div className="loading-message">This may take a moment. Please don't close this page.</div>}
        </>
      )}
    </div>
  );
}
