import useDelegateSmartAccount from "@/hooks/useDelegateSmartAccount";
import useDelegatorSmartAccount from "@/hooks/useDelegatorSmartAccount";
import { useStepContext } from "@/hooks/useStepContext";
import useStorageClient from "@/hooks/useStorageClient";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import ConnectButton from "./ConnectButton";
import CreateDelegateButton from "./CreateDelegateButton";
import DeployDelegatorButton from "./DeployDelegatorButton";
import SubscriptionPlans from "./SubscriptionPlans";
import SubscriptionManager from "./SubscriptionManager";
import "./Steps.css";

export default function Steps() {
  const { step, changeStep } = useStepContext();
  const { isConnected } = useAccount();
  const { smartAccount } = useDelegatorSmartAccount();
  const { smartAccount: delegateSmartAccount } = useDelegateSmartAccount();
  const { getDelegation } = useStorageClient();

  // State for options
  const [useSmartAccount, setUseSmartAccount] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      changeStep(1);
      return;
    }
    
    // If user has chosen not to use smart accounts, always go to subscription plans
    if (isConnected && !useSmartAccount) {
      changeStep(4);
      return;
    }

    // Only proceed with smart account flow if the user opted for it
    if (isConnected && useSmartAccount && smartAccount && !delegateSmartAccount) {
      smartAccount.isDeployed().then((isDeployed) => {
        if (!isDeployed) {
          changeStep(2);
        }
        if (isDeployed) {
          changeStep(3);
        }
      });
    }

    if (isConnected && useSmartAccount && smartAccount && delegateSmartAccount) {
      const delegation = getDelegation(delegateSmartAccount.address);
      if (!delegation) {
        changeStep(4);
      } else {
        changeStep(5);
      }
    }
  }, [isConnected, smartAccount, delegateSmartAccount, useSmartAccount]);

  const skipToPlans = () => {
    changeStep(4);
  };
  
  return (
    <div className="subscription-steps">
      {step === 1 && (
        <div className="subscription-step">
          <h2>Connect Your Wallet</h2>
          <p className="step-description">
            Connect your MetaMask wallet to get started with subscription payments.
            Your wallet will be used to create a delegation for automated recurring payments on the Sepolia network.
          </p>
          <ConnectButton />
          
          {isConnected && (
            <div className="subscription-options">
              <h3>Setup Options</h3>
              <div className="option-toggle">
                <label className="toggle-label">
                  <input 
                    type="checkbox" 
                    checked={useSmartAccount} 
                    onChange={() => setUseSmartAccount(!useSmartAccount)}
                  />
                  <span className="toggle-text">Use Smart Contract Account</span>
                </label>
                <div className="option-description">
                  <p>Smart contract accounts provide enhanced security and features for delegations.</p>
                  <p>For this demo, you can skip this step to quickly see the subscription interface.</p>
                </div>
              </div>
              
              {useSmartAccount ? (
                <button 
                  className="button option-button" 
                  onClick={() => changeStep(2)}
                >
                  Continue with Smart Account Setup
                </button>
              ) : (
                <button 
                  className="button option-button" 
                  onClick={skipToPlans}
                >
                  Skip to Subscription Plans
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      {step === 2 && useSmartAccount && (
        <div className="subscription-step">
          <h2>Deploy Smart Contract Account</h2>
          <p className="step-description">
            We're deploying a smart contract account that will be used to authorize subscription payments.
            This enables secure, automated payments without needing your approval each time.
          </p>
          <div className="info-box">
            <h4>Why Deploy a Contract?</h4>
            <p>
              The MetaMask Delegation Toolkit uses Account Abstraction (ERC-4337) to enable delegation.
              Smart contract accounts allow for more advanced permissions than regular EOA wallets.
            </p>
          </div>
          <DeployDelegatorButton />
          <button className="button secondary-button" onClick={skipToPlans}>
            Skip Contract Deployment
          </button>
        </div>
      )}
      
      {step === 3 && useSmartAccount && (
        <div className="subscription-step">
          <h2>Create Delegate Account</h2>
          <p className="step-description">
            This account will handle your subscription payments on your behalf
            based on the permissions you grant in the next step.
          </p>
          <CreateDelegateButton />
          <button className="button secondary-button" onClick={skipToPlans}>
            Skip to Subscription Plans
          </button>
        </div>
      )}
      
      {step === 4 && (
        <div className="subscription-step subscription-plan-step">
          <SubscriptionPlans />
        </div>
      )}
      
      {step === 5 && (
        <div className="subscription-step subscription-manager-step">
          <SubscriptionManager />
        </div>
      )}
    </div>
  );
}
