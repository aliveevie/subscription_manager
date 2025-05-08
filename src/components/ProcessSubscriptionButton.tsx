import { useState } from "react";
import { useAccount } from "wagmi";
import useDelegateSmartAccount from "@/hooks/useDelegateSmartAccount";
import useStorageClient from "@/hooks/useStorageClient";
import { redeemSubscriptionPayment } from "@/utils/subscriptionUtils";
import { parseEther } from "viem";

// Mock bundler client for demo purposes
// In a real app, this would come from a proper bundler service
const bundlerClient = {
  sendUserOperation: async ({ account, calls }: any) => {
    console.log("Simulating payment processing...", { account, calls });
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return "0x" + Math.random().toString(16).substring(2);
  }
};

interface ProcessSubscriptionButtonProps {
  serviceAddress: `0x${string}`;
  planPrice: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function ProcessSubscriptionButton({
  serviceAddress,
  planPrice,
  onSuccess,
  onError
}: ProcessSubscriptionButtonProps) {
  const { address } = useAccount();
  const { smartAccount: delegateAccount } = useDelegateSmartAccount();
  const { getDelegation } = useStorageClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Extract numeric value from price string (e.g., "0.01 ETH" -> 0.01)
  const getPriceValue = () => {
    const match = planPrice.match(/[\d.]+/);
    return match ? match[0] : "0";
  };

  const handleProcessPayment = async () => {
    if (!delegateAccount || !address) {
      onError("Wallet not connected or delegate account not initialized");
      return;
    }

    try {
      setIsProcessing(true);

      // Get the delegation from local storage
      const delegation = getDelegation(delegateAccount.address);
      if (!delegation) {
        throw new Error("No valid delegation found for this subscription");
      }

      // Parse the price to wei
      const priceValue = getPriceValue();
      const priceInWei = parseEther(priceValue);

      // Create the call data for processing the payment
      const redeemCalldata = redeemSubscriptionPayment(
        [delegation],
        serviceAddress,
        priceInWei
      );

      // Process the payment using the bundler client
      const userOperationHash = await bundlerClient.sendUserOperation({
        account: delegateAccount,
        calls: [
          {
            to: delegateAccount.address as `0x${string}`, // Adding type casting for delegateAccount.address
            data: redeemCalldata
          }
        ],
        maxFeePerGas: 1n,
        maxPriorityFeePerGas: 1n,
      });

      console.log("Subscription payment processed, tx hash:", userOperationHash);
      onSuccess();
    } catch (err) {
      console.error("Error processing subscription payment:", err);
      onError(err instanceof Error ? err.message : "Unknown error processing payment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button 
      className="process-payment-button"
      onClick={handleProcessPayment}
      disabled={isProcessing}
    >
      {isProcessing ? "Processing Payment..." : "Process Next Payment"}
    </button>
  );
}
