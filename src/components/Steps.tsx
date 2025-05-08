import useDelegateSmartAccount from "@/hooks/useDelegateSmartAccount";
import useDelegatorSmartAccount from "@/hooks/useDelegatorSmartAccount";
import { useStepContext } from "@/hooks/useStepContext";
import useStorageClient from "@/hooks/useStorageClient";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import ConnectButton from "./ConnectButton";
import CreateDelegateButton from "./CreateDelegateButton";
import CreateDelegationButton from "./CreateDelegationButton";
import DeployDelegatorButton from "./DeployDelegatorButton";
import RedeemDelegationButton from "./RedeemDelegationButton";
import "./Steps.css";



export default function Steps() {
  const { step, changeStep } = useStepContext();
  const { isConnected } = useAccount();
  const { smartAccount } = useDelegatorSmartAccount();
  const { smartAccount: delegateSmartAccount } = useDelegateSmartAccount();
  const { getDelegation } = useStorageClient();

  // State for subscription plans and options
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [useSmartAccount, setUseSmartAccount] = useState(false);
  
  // Example subscription plans
  const subscriptionPlans = [
    {
      id: 1,
      name: "Basic",
      price: "0.01 ETH",
      period: "Monthly",
      features: ["Basic content access", "Standard support", "Single device"]
    },
    {
      id: 2,
      name: "Premium",
      price: "0.05 ETH",
      period: "Monthly",
      features: ["Premium content access", "Priority support", "Multiple devices", "No ads"]
    },
    {
      id: 3,
      name: "Annual",
      price: "0.5 ETH",
      period: "Yearly",
      features: ["All premium features", "VIP support", "Unlimited devices", "Offline access", "20% discount"]
    }
  ];

  useEffect(() => {
    if (!isConnected) {
      changeStep(1);
    }

    if (isConnected && smartAccount && !delegateSmartAccount) {
      smartAccount.isDeployed().then((isDeployed) => {
        if (!isDeployed) {
          changeStep(2);
        }
        if (isDeployed) {
          changeStep(3);
        }
      });
    }

    if (isConnected && smartAccount && delegateSmartAccount) {
      const delegation = getDelegation(delegateSmartAccount.address);
      if (!delegation) {
        changeStep(4);
      } else {
        setIsSubscribed(true);
        changeStep(5);
      }
    }
  }, [isConnected, smartAccount, delegateSmartAccount]);

  const selectPlan = (planId: number) => {
    setSelectedPlan(planId);
  };

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
            Your wallet will be used to create a delegation for automated recurring payments.
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
        <div className="subscription-step">
          <h2>Choose Your Subscription Plan</h2>
          <p className="step-description">
            Select a subscription plan that works for you. Your payment will be automated
            using MetaMask's delegation toolkit - no need to approve each payment!
          </p>
          
          <div className="subscription-plans">
            {subscriptionPlans.map((plan) => (
              <div 
                key={plan.id} 
                className={`plan-card ${selectedPlan === plan.id ? 'plan-selected' : ''}`}
                onClick={() => selectPlan(plan.id)}
              >
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price">{plan.price}</div>
                <div className="plan-period">{plan.period}</div>
                <ul className="plan-features">
                  {plan.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          {selectedPlan && (
            <div className="create-subscription">
              <p className="subscription-info">
                You're creating an automated subscription payment delegation.
                This will allow payments to be processed automatically without requiring
                your approval each time.
              </p>
              {useSmartAccount ? (
                <CreateDelegationButton />
              ) : (
                <button 
                  className="button primary-button"
                  onClick={() => changeStep(5)}
                >
                  Subscribe Now
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      {step === 5 && (
        <div className="subscription-step">
          <h2>Subscription Active!</h2>
          <p className="step-description">
            Your subscription is now active and payments will be processed automatically
            according to your chosen plan. The merchant can now process payments without
            requiring your approval each time.
          </p>
          
          {useSmartAccount && isSubscribed ? (
            <div className="subscription-demo">
              <h3>Subscription Payment Demo</h3>
              <p>As a demonstration, you can simulate a merchant processing a subscription payment:</p>
              <RedeemDelegationButton />
            </div>
          ) : (
            <div className="subscription-demo">
              <h3>Subscription Payment Demo</h3>
              <p>
                In a real implementation, the merchant would use the delegation to process
                payments periodically without requiring your approval each time.
              </p>
              <button className="button demo-button">
                Simulate Payment (Demo Only)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
