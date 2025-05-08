import { 
  createDelegation, 
  type Caveat,
  DelegationFramework,
  SINGLE_DEFAULT_MODE 
} from "@metamask/delegation-toolkit";
import { parseEther } from "viem";

// Subscription periods in seconds
export const SUBSCRIPTION_PERIODS = {
  DAILY: 60 * 60 * 24,
  WEEKLY: 60 * 60 * 24 * 7,
  MONTHLY: 60 * 60 * 24 * 30,
  YEARLY: 60 * 60 * 24 * 365
};

// Create a time-limited delegation for a subscription
export const createSubscriptionDelegation = (
  delegatorAddress: `0x${string}`,
  delegateAddress: `0x${string}`,
  amountInWei: bigint,
  periodInSeconds: number,
  maxRenewals: number = 12 // Default to 12 renewals
) => {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + (periodInSeconds * maxRenewals);

  // Sample implementation for enforcer addresses (in a real app, use actual contract addresses)
  const TIME_ENFORCER_ADDRESS = "0x1234567890123456789012345678901234567890" as `0x${string}`;
  const AMOUNT_ENFORCER_ADDRESS = "0x0987654321098765432109876543210987654321" as `0x${string}`;
  
  // Time-based caveat for the subscription
  const timeCaveat: Caveat = {
    enforcer: TIME_ENFORCER_ADDRESS,
    terms: "0x" as `0x${string}`,
    args: {
      notBefore: BigInt(now).toString(),
      notAfter: BigInt(expiresAt).toString()
    }
  };

  // Amount-based caveat to limit the payment amount
  const amountCaveat: Caveat = {
    enforcer: AMOUNT_ENFORCER_ADDRESS,
    terms: "0x" as `0x${string}`,
    args: {
      amount: amountInWei.toString()
    }
  };

  // Create the delegation with our caveats
  return createDelegation({
    to: delegateAddress,
    from: delegatorAddress,
    caveats: [timeCaveat, amountCaveat]
  });
};

// Function to create the calldata for processing a subscription payment
export const createSubscriptionPayment = (
  recipientAddress: `0x${string}`,
  amountInWei: bigint
) => {
  // Create an ERC-20 transfer calldata (for ETH we'll use a simple transfer)
  // In a real app, you'd use the ERC-20 contract ABI for tokens
  
  // For ETH transfers, we simply return an empty calldata with the value
  return {
    target: recipientAddress,
    value: amountInWei,
    callData: "0x" as `0x${string}`
  };
};

// Create the transaction for redeeming a subscription payment
export const redeemSubscriptionPayment = (
  delegations: any[],
  recipientAddress: `0x${string}`,
  amountInWei: bigint
) => {
  // Create execution data with proper type casting
  const execution = createSubscriptionPayment(recipientAddress, amountInWei);
  
  // Create redemption calldata
  return DelegationFramework.encode.redeemDelegations({
    delegations: [delegations],
    modes: [SINGLE_DEFAULT_MODE],
    executions: [[execution]]
  });
};
