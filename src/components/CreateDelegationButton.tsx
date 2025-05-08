import useDelegateSmartAccount from "@/hooks/useDelegateSmartAccount";
import useDelegatorSmartAccount from "@/hooks/useDelegatorSmartAccount";
import { useStepContext } from "@/hooks/useStepContext";
import useStorageClient from "@/hooks/useStorageClient";
import { prepareRootDelegation, SUBSCRIPTION_PERIODS } from "@/utils/delegationUtils";
import { useState } from "react";
import "./CreateDelegationButton.css";

export default function CreateDelegationButton() {
  const { smartAccount } = useDelegatorSmartAccount();
  const { storeDelegation } = useStorageClient();
  const { smartAccount: delegateSmartAccount } = useDelegateSmartAccount();
  const { changeStep } = useStepContext();
  
  // State for delegation type (regular or subscription)
  const [isSubscription, setIsSubscription] = useState(false);
  const [subscriptionPeriod, setSubscriptionPeriod] = useState(SUBSCRIPTION_PERIODS.MONTHLY);
  const [maxRenewals, setMaxRenewals] = useState(12);

  const handleCreateDelegation = async () => {
    if (!smartAccount || !delegateSmartAccount) return;
    console.log(smartAccount.address, delegateSmartAccount.address);
    
    const delegation = prepareRootDelegation(
      smartAccount,
      delegateSmartAccount.address,
      isSubscription,
      subscriptionPeriod,
      maxRenewals
    );

    const signature = await smartAccount.signDelegation({
      delegation,
    });

    const signedDelegation = {
      ...delegation,
      signature,
      // Add metadata for subscription details to help with UI display
      metadata: isSubscription ? {
        isSubscription: true,
        period: subscriptionPeriod,
        maxRenewals,
        createdAt: Date.now(),
      } : undefined
    };

    console.log(signedDelegation);
    storeDelegation(signedDelegation);
    changeStep(5);
  };

  return (
    <div className="delegation-container">
      <div className="delegation-options">
        <div className="delegation-type">
          <label>
            <input
              type="checkbox"
              checked={isSubscription}
              onChange={(e) => setIsSubscription(e.target.checked)}
            />
            Enable subscription-based delegation
          </label>
        </div>
        
        {isSubscription && (
          <div className="subscription-options">
            <div className="option-group">
              <label>Subscription Period:</label>
              <select 
                value={subscriptionPeriod}
                onChange={(e) => setSubscriptionPeriod(Number(e.target.value))}
              >
                <option value={SUBSCRIPTION_PERIODS.DAILY}>Daily</option>
                <option value={SUBSCRIPTION_PERIODS.WEEKLY}>Weekly</option>
                <option value={SUBSCRIPTION_PERIODS.MONTHLY}>Monthly</option>
                <option value={SUBSCRIPTION_PERIODS.YEARLY}>Yearly</option>
              </select>
            </div>
            
            <div className="option-group">
              <label>Max Renewals:</label>
              <select
                value={maxRenewals}
                onChange={(e) => setMaxRenewals(Number(e.target.value))}
              >
                <option value={1}>1</option>
                <option value={3}>3</option>
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      <div className="delegation-info">
        {isSubscription && (
          <div className="subscription-info">
            <p><strong>You are creating a subscription delegation that:</strong></p>
            <ul>
              <li>Allows automated recurring payments</li>
              <li>Will be valid for up to {maxRenewals} payments</li>
              <li>Can be processed at {getPeriodName(subscriptionPeriod)} intervals</li>
              <li>No need to approve each payment - it's all handled through delegation!</li>
            </ul>
          </div>
        )}
      </div>
      
      <button className="button" onClick={handleCreateDelegation}>
        {isSubscription ? "Create Subscription Delegation" : "Create Delegation"}
      </button>
    </div>
  );
}

// Helper function to get period name from seconds
function getPeriodName(periodInSeconds: number): string {
  switch (periodInSeconds) {
    case SUBSCRIPTION_PERIODS.DAILY:
      return "daily";
    case SUBSCRIPTION_PERIODS.WEEKLY:
      return "weekly";
    case SUBSCRIPTION_PERIODS.MONTHLY:
      return "monthly";
    case SUBSCRIPTION_PERIODS.YEARLY:
      return "yearly";
    default:
      return "regular";
  }
}
