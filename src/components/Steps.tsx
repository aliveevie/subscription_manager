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
import { NETWORK_CONFIG } from "@/utils/subscriptionUtils";
import "./Steps.css";

export default function Steps() {
  const { step, changeStep } = useStepContext();
  const { isConnected } = useAccount();
  const { smartAccount } = useDelegatorSmartAccount();
  const { smartAccount: delegateSmartAccount } = useDelegateSmartAccount();
  const { getDelegation } = useStorageClient();

  // State for options and status tracking
  const [useSmartAccount, setUseSmartAccount] = useState(true); // Default to true for better experience
  const [accountSetupStatus, setAccountSetupStatus] = useState({
    delegatorDeployed: false,
    delegateCreated: false
  });
  const [setupError, setSetupError] = useState<string | null>(null);

  // Check if API key is configured
  const isPimlicoConfigured = import.meta.env.VITE_PIMLICO_API_KEY && 
    import.meta.env.VITE_PIMLICO_API_KEY !== "";

  // Check account setup status
  useEffect(() => {
    if (smartAccount) {
      smartAccount.isDeployed().then((isDeployed) => {
        setAccountSetupStatus(prev => ({ ...prev, delegatorDeployed: isDeployed }));
      }).catch(error => {
        console.error("Error checking if delegator is deployed:", error);
        setSetupError("Error checking delegator status. Please ensure you're connected to Sepolia network.");
      });
    }

    if (delegateSmartAccount) {
      setAccountSetupStatus(prev => ({ ...prev, delegateCreated: true }));
    }
  }, [smartAccount, delegateSmartAccount]);

  // Handle step navigation
  useEffect(() => {
    if (!isConnected) {
      changeStep(1);
      return;
    }
    
    // If user has chosen not to use smart accounts, go to subscription plans
    if (isConnected && !useSmartAccount) {
      changeStep(4);
      return;
    }

    // Smart account flow
    if (isConnected && useSmartAccount) {
      if (!accountSetupStatus.delegatorDeployed) {
        changeStep(2); // Deploy delegator
        return;
      }
      
      if (accountSetupStatus.delegatorDeployed && !accountSetupStatus.delegateCreated) {
        changeStep(3); // Create delegate
        return;
      }
      
      if (accountSetupStatus.delegatorDeployed && accountSetupStatus.delegateCreated) {
        const delegation = delegateSmartAccount ? getDelegation(delegateSmartAccount.address) : null;
        if (!delegation) {
          changeStep(4); // Choose subscription plan
        } else {
          changeStep(5); // Subscription management
        }
      }
    }
  }, [isConnected, useSmartAccount, accountSetupStatus, delegateSmartAccount]);

  const skipToPlans = () => {
    setUseSmartAccount(false);
    changeStep(4);
  };

  const handleCompleteStep = (currentStep: number) => {
    changeStep(currentStep + 1);
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
              <div className="account-options">
                <h4>Account Setup Options</h4>
                
                <div className="option-cards">
                  <div 
                    className={`option-card ${useSmartAccount ? 'selected' : ''}`}
                    onClick={() => setUseSmartAccount(true)}
                  >
                    <div className="option-header">
                      <div className="option-icon">🔐</div>
                      <h5>Smart Account</h5>
                      <div className="option-badge recommended">Recommended</div>
                    </div>
                    <div className="option-description">
                      <p>Deploy a smart contract account for enhanced security and delegation features.</p>
                      <ul className="option-features">
                        <li>Better security with account abstraction</li>
                        <li>Full subscription management</li>
                        <li>Automated recurring payments</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div 
                    className={`option-card ${!useSmartAccount ? 'selected' : ''}`}
                    onClick={() => setUseSmartAccount(false)}
                  >
                    <div className="option-header">
                      <div className="option-icon">🚀</div>
                      <h5>Regular Account</h5>
                      <div className="option-badge quick">Quick Setup</div>
                    </div>
                    <div className="option-description">
                      <p>Use your regular wallet without deploying a smart contract.</p>
                      <ul className="option-features">
                        <li>No deployment needed</li>
                        <li>Faster setup process</li>
                        <li>Limited subscription features</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="option-note">
                  <p><strong>Note:</strong> In a real subscription system, each subscriber would need their own smart account to authorize recurring payments. For this demo, you can choose either option.</p>
                </div>
              </div>
              
              {!isPimlicoConfigured && (
                <div className="warning-box">
                  <h4>API Key Configuration</h4>
                  <p>
                    The Pimlico API key is already configured in your environment. This is required for smart account functionality.
                  </p>
                </div>
              )}
              
              <div className="network-info-box">
                <div className="network-info-header">
                  <span className="network-dot"></span>
                  <h4>Sepolia Test Network</h4>
                </div>
                <p>
                  This application runs on the Sepolia test network. Make sure your wallet is connected to Sepolia.
                </p>
                <div className="network-details">
                  <div className="network-detail">
                    <span className="detail-label">Network Name:</span>
                    <span className="detail-value">{NETWORK_CONFIG.name}</span>
                  </div>
                  <div className="network-detail">
                    <span className="detail-label">Chain ID:</span>
                    <span className="detail-value">{NETWORK_CONFIG.chainId}</span>
                  </div>
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
          <h2>Step 1: Deploy Smart Contract Account</h2>
          <p className="step-description">
            We're deploying a smart contract account that will be used to authorize subscription payments.
            This enables secure, automated payments without needing your approval each time.
          </p>
          
          <div className="setup-progress">
            <div className="progress-step active">
              <div className="step-number">1</div>
              <div className="step-label">Deploy Account</div>
            </div>
            <div className="progress-connector"></div>
            <div className="progress-step">
              <div className="step-number">2</div>
              <div className="step-label">Create Delegate</div>
            </div>
            <div className="progress-connector"></div>
            <div className="progress-step">
              <div className="step-number">3</div>
              <div className="step-label">Subscribe</div>
            </div>
          </div>
          
          <div className="info-box">
            <h4>Why Deploy a Contract?</h4>
            <p>
              The MetaMask Delegation Toolkit uses Account Abstraction (ERC-4337) to enable delegation.
              Smart contract accounts allow for more advanced permissions than regular EOA wallets.
            </p>
          </div>
          
          {setupError && <div className="error-box">{setupError}</div>}
          
          <div className="action-buttons">
            <DeployDelegatorButton onSuccess={() => handleCompleteStep(2)} />
            <button className="button secondary-button" onClick={skipToPlans}>
              Skip Smart Account Setup
            </button>
          </div>
        </div>
      )}
      
      {step === 3 && useSmartAccount && (
        <div className="subscription-step">
          <h2>Step 2: Create Delegate Account</h2>
          <p className="step-description">
            Now we'll create a delegate account that will handle subscription payments on your behalf
            based on the permissions you grant in the next step.
          </p>
          
          <div className="setup-progress">
            <div className="progress-step completed">
              <div className="step-number">✓</div>
              <div className="step-label">Deploy Account</div>
            </div>
            <div className="progress-connector completed"></div>
            <div className="progress-step active">
              <div className="step-number">2</div>
              <div className="step-label">Create Delegate</div>
            </div>
            <div className="progress-connector"></div>
            <div className="progress-step">
              <div className="step-number">3</div>
              <div className="step-label">Subscribe</div>
            </div>
          </div>
          
          <div className="action-buttons">
            <CreateDelegateButton onSuccess={() => handleCompleteStep(3)} />
            <button className="button secondary-button" onClick={skipToPlans}>
              Skip to Subscription Plans
            </button>
          </div>
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
