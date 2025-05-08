import { useState } from "react";
import useDelegatorSmartAccount from "@/hooks/useDelegatorSmartAccount";
import useDelegateSmartAccount from "@/hooks/useDelegateSmartAccount";
import useStorageClient from "@/hooks/useStorageClient";
import { createSubscriptionDelegation, SUBSCRIPTION_PERIODS } from "@/utils/subscriptionUtils";
import { parseEther } from "viem";

interface CreateSubscriptionButtonProps {
  planId: number;
  planName: string;
  planPrice: string;
  planPeriod: string;
  onSuccess: () => void;
}

export default function CreateSubscriptionButton({
  planId,
  planName,
  planPrice,
  planPeriod,
  onSuccess,
}: CreateSubscriptionButtonProps) {
  const { smartAccount: delegatorAccount } = useDelegatorSmartAccount();
  const { smartAccount: delegateAccount } = useDelegateSmartAccount();
  const { storeDelegation } = useStorageClient();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert plan period string to seconds
  const getPeriodInSeconds = () => {
    switch (planPeriod.toLowerCase()) {
      case "daily":
        return SUBSCRIPTION_PERIODS.DAILY;
      case "weekly":
        return SUBSCRIPTION_PERIODS.WEEKLY;
      case "monthly":
        return SUBSCRIPTION_PERIODS.MONTHLY;
      case "yearly":
        return SUBSCRIPTION_PERIODS.YEARLY;
      default:
        return SUBSCRIPTION_PERIODS.MONTHLY;
    }
  };

  // Extract numeric value from price string (e.g., "0.01 ETH" -> 0.01)
  const getPriceValue = () => {
    const match = planPrice.match(/[\d.]+/);
    return match ? match[0] : "0";
  };

  const handleCreateSubscription = async () => {
    if (!delegatorAccount || !delegateAccount) {
      setError("Accounts not initialized. Please connect your wallet.");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const priceValue = getPriceValue();
      const priceInWei = parseEther(priceValue);
      const periodInSeconds = getPeriodInSeconds();
      
      // Create a subscription delegation
      const delegation = createSubscriptionDelegation(
        delegatorAccount.address,
        delegateAccount.address,
        priceInWei,
        periodInSeconds,
        12 // Allow up to 12 automatic renewals
      );

      // Sign the delegation
      const signature = await delegatorAccount.signDelegation({
        delegation,
      });

      // Store the signed delegation
      const signedDelegation = {
        ...delegation,
        signature,
      };
      
      storeDelegation(signedDelegation);
      
      // Notify parent component of success
      onSuccess();
    } catch (err) {
      console.error("Error creating subscription:", err);
      setError(err instanceof Error ? err.message : "Unknown error creating subscription");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="subscription-action">
      <button 
        className="subscribe-button"
        onClick={handleCreateSubscription}
        disabled={isCreating}
      >
        {isCreating ? "Creating Subscription..." : `Subscribe to ${planName}`}
      </button>
      
      {error && (
        <div className="subscription-error">
          {error}
        </div>
      )}
    </div>
  );
}
