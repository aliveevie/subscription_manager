import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import useDelegateSmartAccount from "@/hooks/useDelegateSmartAccount";
import useDelegatorSmartAccount from "@/hooks/useDelegatorSmartAccount";
import useStorageClient from "@/hooks/useStorageClient";
import { useStepContext } from "@/hooks/useStepContext";
import { useAccountAbstractionUtils } from "@/hooks/useAccountAbstractionUtils";
import { prepareRootDelegation } from "@/utils/delegationUtils";
import { ExtendedDelegation } from "@/types/delegation";
import { 
  SUBSCRIPTION_PLANS, 
  formatEthAmount, 
  formatSubscriptionPeriod,
  calculateNextPaymentDate,
  getSubscriptionStatus
} from "@/utils/subscriptionUtils";
import ConnectButton from "./ConnectButton";
import "./SubscriptionPlans.css";

interface SubscriptionDetails {
  planId: number;
  startDate: number;
  nextPaymentDate: number;
  period: number;
  maxRenewals: number;
  currentRenewals: number;
  status: 'active' | 'expired';
}

export default function SubscriptionPlans() {
  const { isConnected, address } = useAccount();
  const { smartAccount } = useDelegatorSmartAccount();
  const { smartAccount: delegateSmartAccount } = useDelegateSmartAccount();
  const { storeDelegation, getDelegation } = useStorageClient();
  const { changeStep } = useStepContext();
  // We'll keep these variables but they're not used in this component
  // const { bundlerClient, paymasterClient, pimlicoClient } = useAccountAbstractionUtils();
  
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [maxRenewals, setMaxRenewals] = useState<number>(12);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
  // Keep the state but we don't need to set it in this component
  const [transactionHash] = useState<string | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Check for existing subscription
  useEffect(() => {
    if (delegateSmartAccount) {
      const delegation = getDelegation(delegateSmartAccount.address) as ExtendedDelegation;
      if (delegation && delegation.metadata) {
        const { planId, createdAt, period, maxRenewals, currentRenewals = 0 } = delegation.metadata;
        
        if (planId) {
          setSubscriptionDetails({
            planId,
            startDate: createdAt,
            nextPaymentDate: calculateNextPaymentDate(createdAt / 1000, period, currentRenewals).getTime(),
            period,
            maxRenewals,
            currentRenewals,
            status: getSubscriptionStatus(createdAt / 1000, period, maxRenewals, currentRenewals)
          });
        }
      }
    }
  }, [delegateSmartAccount]);
  
  const handleSelectPlan = (planId: number) => {
    setSelectedPlan(planId);
  };
  
  const handleCreateSubscription = async () => {
    if (!isConnected || !selectedPlan) {
      setError("Please connect your wallet and select a plan");
      return;
    }
    
    // Check if we're using smart accounts or regular accounts
    const usingSmartAccount = smartAccount && delegateSmartAccount;
    
    try {
      setIsCreatingSubscription(true);
      setError(null);
      
      const selectedPlanDetails = SUBSCRIPTION_PLANS.find(plan => plan.id === selectedPlan);
      
      if (!selectedPlanDetails) {
        throw new Error("Selected plan not found");
      }
      
      if (usingSmartAccount) {
        // Smart account subscription flow
        // Create the delegation for the subscription
        const delegation = prepareRootDelegation(
          smartAccount,
          delegateSmartAccount.address,
          true, // isSubscription
          selectedPlanDetails.period,
          maxRenewals,
          selectedPlan
        );
        
        // Sign the delegation
        const signature = await smartAccount.signDelegation({
          delegation,
        });
        
        // Create signed delegation with metadata
        const signedDelegation = {
          ...delegation,
          signature,
          metadata: {
            planId: selectedPlan,
            isSubscription: true,
            period: selectedPlanDetails.period,
            maxRenewals,
            currentRenewals: 0,
            createdAt: Date.now(),
          }
        };
        
        // Store the delegation
        storeDelegation(signedDelegation);
      } else {
        // Regular account subscription flow - simplified for demo
        // In a real application, this would involve a different payment mechanism
        // For demo purposes, we'll just simulate a successful subscription
        console.log("Creating subscription with regular account");
        
        // Create a mock subscription for demo purposes
        const mockSubscriptionId = `sub_${Date.now()}_${address?.substring(0, 8)}`;
        
        // We could store this in localStorage or another storage mechanism
        localStorage.setItem(mockSubscriptionId, JSON.stringify({
          planId: selectedPlan,
          address: address,
          period: selectedPlanDetails.period,
          maxRenewals,
          currentRenewals: 0,
          createdAt: Date.now(),
        }));
      }
      
      // Update subscription details (same for both flows)
      setSubscriptionDetails({
        planId: selectedPlan,
        startDate: Date.now(),
        nextPaymentDate: calculateNextPaymentDate(Math.floor(Date.now() / 1000), selectedPlanDetails.period, 0).getTime(),
        period: selectedPlanDetails.period,
        maxRenewals,
        currentRenewals: 0,
        status: 'active'
      });
      
      // Move to the next step
      changeStep(5);
    } catch (err) {
      console.error("Error creating subscription:", err);
      setError(`Failed to create subscription: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsCreatingSubscription(false);
    }
  };
  
  const getSelectedPlanDetails = () => {
    if (!selectedPlan) return null;
    return SUBSCRIPTION_PLANS.find(plan => plan.id === selectedPlan);
  };
  
  const getCurrentSubscriptionPlan = () => {
    if (!subscriptionDetails) return null;
    return SUBSCRIPTION_PLANS.find(plan => plan.id === subscriptionDetails.planId);
  };
  
  return (
    <div className="subscription-plans-container">
      {!isConnected ? (
        <div className="wallet-connect-section">
          <h2>Connect Your Wallet</h2>
          <p className="connect-description">
            To view and manage subscription plans, please connect your MetaMask wallet first.
            This will allow you to create automated subscription payments on the Sepolia test network.
          </p>
          <div className="connect-button-container">
            <ConnectButton />
          </div>
          <div className="network-info">
            <div className="network-badge">Sepolia Test Network</div>
            <p className="network-note">
              This application runs on the Sepolia test network. Make sure your wallet is configured for Sepolia.
            </p>
          </div>
        </div>
      ) : subscriptionDetails ? (
        <div className="active-subscription">
          <h2>Your Active Subscription</h2>
          
          {getCurrentSubscriptionPlan() && (
            <div className="subscription-details">
              <div className="plan-header">
                <h3>{getCurrentSubscriptionPlan()?.name} Plan</h3>
                <span className={`status-badge ${subscriptionDetails.status}`}>
                  {subscriptionDetails.status === 'active' ? 'Active' : 'Expired'}
                </span>
              </div>
              
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Price:</span>
                  <span className="detail-value">{formatEthAmount(getCurrentSubscriptionPlan()?.price || BigInt(0))}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Billing Cycle:</span>
                  <span className="detail-value">{formatSubscriptionPeriod(subscriptionDetails.period)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Start Date:</span>
                  <span className="detail-value">{new Date(subscriptionDetails.startDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Next Payment:</span>
                  <span className="detail-value">{new Date(subscriptionDetails.nextPaymentDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Renewals:</span>
                  <span className="detail-value">{subscriptionDetails.currentRenewals} of {subscriptionDetails.maxRenewals}</span>
                </div>
              </div>
              
              {transactionHash && (
                <div className="transaction-info">
                  <p>Last transaction: <a href={`https://sepolia.etherscan.io/tx/${transactionHash}`} target="_blank" rel="noopener noreferrer">View on Etherscan</a></p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          <h2>Choose Your Subscription Plan</h2>
          <p className="plans-description">
            Select a subscription plan that works for you. Your payment will be automated
            using MetaMask's delegation toolkit - no need to approve each payment!
          </p>
          
          <div className="plans-grid">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div 
                key={plan.id} 
                className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
                onClick={() => handleSelectPlan(plan.id)}
              >
                <div className="plan-header">
                  <h3>{plan.name}</h3>
                  {plan.period === SUBSCRIPTION_PLANS[3].period && (
                    <span className="discount-badge">20% off</span>
                  )}
                </div>
                <div className="plan-price">{formatEthAmount(plan.price)}</div>
                <div className="plan-period">{formatSubscriptionPeriod(plan.period)}</div>
                <p className="plan-description">{plan.description}</p>
                <ul className="plan-features">
                  {plan.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          {selectedPlan && (
            <div className="subscription-options">
              <h3>Subscription Options</h3>
              
              <div className="option-group">
                <label htmlFor="maxRenewals">Maximum Renewals:</label>
                <select 
                  id="maxRenewals"
                  value={maxRenewals}
                  onChange={(e) => setMaxRenewals(Number(e.target.value))}
                >
                  <option value={1}>1 payment</option>
                  <option value={3}>3 payments</option>
                  <option value={6}>6 payments</option>
                  <option value={12}>12 payments</option>
                  <option value={24}>24 payments</option>
                </select>
              </div>
              
              <div className="subscription-summary">
                <h4>Summary</h4>
                <div className="summary-item">
                  <span>Plan:</span>
                  <span>{getSelectedPlanDetails()?.name}</span>
                </div>
                <div className="summary-item">
                  <span>Price per period:</span>
                  <span>{formatEthAmount(getSelectedPlanDetails()?.price || BigInt(0))}</span>
                </div>
                <div className="summary-item">
                  <span>Billing cycle:</span>
                  <span>{formatSubscriptionPeriod(getSelectedPlanDetails()?.period || 0)}</span>
                </div>
                <div className="summary-item">
                  <span>Maximum payments:</span>
                  <span>{maxRenewals}</span>
                </div>
                <div className="summary-item total">
                  <span>Total commitment:</span>
                  <span>
                    {formatEthAmount((getSelectedPlanDetails()?.price || BigInt(0)) * BigInt(maxRenewals))}
                  </span>
                </div>
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <button 
                className="subscribe-button"
                onClick={handleCreateSubscription}
                disabled={isCreatingSubscription || !selectedPlan}
              >
                {isCreatingSubscription ? "Creating Subscription..." : "Subscribe Now"}
              </button>
              
              {(!smartAccount || !delegateSmartAccount) && (
                <div className="account-info">
                  <p>You're subscribing with a regular wallet. For enhanced features like automated renewals, consider setting up a smart account in the account options.</p>
                </div>
              )}
              
              <p className="subscription-note">
                By subscribing, you authorize automatic payments via MetaMask delegation.
                Your subscription will be active on the Sepolia test network.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
