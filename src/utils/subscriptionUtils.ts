import { 
  createDelegation, 
  type Caveat,
  DelegationFramework,
  SINGLE_DEFAULT_MODE,
  createExecution,
  type Delegation
} from "@metamask/delegation-toolkit";
import { parseEther, Address, Hex } from "viem";

// Subscription periods in seconds
export const SUBSCRIPTION_PERIODS = {
  DAILY: 60 * 60 * 24,
  WEEKLY: 60 * 60 * 24 * 7,
  MONTHLY: 60 * 60 * 24 * 30,
  YEARLY: 60 * 60 * 24 * 365
};

// Subscription plans with real ETH values for Sepolia network
export const SUBSCRIPTION_PLANS = [
  {
    id: 1,
    name: "Basic",
    description: "Basic subscription tier with essential features",
    price: parseEther("0.01"), // 0.01 ETH in wei
    period: SUBSCRIPTION_PERIODS.MONTHLY,
    features: ["Basic content access", "Standard support", "Single device"]
  },
  {
    id: 2,
    name: "Professional",
    description: "Professional subscription with advanced features",
    price: parseEther("0.05"), // 0.05 ETH in wei
    period: SUBSCRIPTION_PERIODS.MONTHLY,
    features: ["Full content library", "Priority support", "Multiple devices", "Advanced analytics", "No advertisements"]
  },
  {
    id: 3,
    name: "Enterprise",
    description: "Enterprise subscription with premium features",
    price: parseEther("0.1"), // 0.1 ETH in wei
    period: SUBSCRIPTION_PERIODS.MONTHLY,
    features: ["All premium features", "Dedicated support", "Unlimited devices", "Custom integrations", "API access", "Team management"]
  },
  {
    id: 4,
    name: "Annual Pro",
    description: "Annual professional subscription with 20% discount",
    price: parseEther("0.48"), // 0.48 ETH in wei (0.05 * 12 months - 20% discount)
    period: SUBSCRIPTION_PERIODS.YEARLY,
    features: ["All professional features", "20% annual discount", "Priority support", "Multiple devices", "Advanced analytics", "No advertisements"]
  }
];

// Sepolia network configuration
export const NETWORK_CONFIG = {
  chainId: 11155111, // Sepolia chain ID
  name: "Sepolia",
  rpcUrl: "https://sepolia.infura.io/v3/", // Add your Infura API key in .env
  blockExplorer: "https://sepolia.etherscan.io",
  currency: "ETH"
};

// Create a time-limited delegation for a subscription
export const createSubscriptionDelegation = (
  delegatorAddress: `0x${string}`,
  delegateAddress: `0x${string}`,
  amountInWei: bigint,
  periodInSeconds: number,
  maxRenewals: number = 12 // Default to 12 renewals
): Delegation => {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + (periodInSeconds * maxRenewals);

  // In a real implementation, you would use actual enforcer contract addresses
  // For now, we'll use the limitedCalls caveat from the delegation toolkit
  
  return createDelegation({
    to: delegateAddress,
    from: delegatorAddress,
    caveats: [
      {
        type: "limitedCalls",
        value: maxRenewals
      },
      // In a production environment, you would add additional caveats:
      // 1. Time-based caveat (to limit subscription duration)
      // 2. Amount-based caveat (to limit payment amount)
      // 3. Network-based caveat (to ensure it only works on Sepolia)
    ]
  });
};

// Function to create the execution data for processing a subscription payment
export const createSubscriptionPayment = (
  recipientAddress: Address,
  amountInWei: bigint
) => {
  // Create an execution for sending ETH
  return createExecution({
    to: recipientAddress,
    value: amountInWei,
    data: "0x" as Hex // Empty data for ETH transfers
  });
};

// Create the transaction for redeeming a subscription payment
export const redeemSubscriptionPayment = (
  delegation: Delegation,
  recipientAddress: Address,
  amountInWei: bigint
): Hex => {
  // Create execution for the payment
  const execution = createSubscriptionPayment(recipientAddress, amountInWei);
  
  // Create redemption calldata
  return DelegationFramework.encode.redeemDelegations({
    delegations: [[delegation]],
    modes: [SINGLE_DEFAULT_MODE],
    executions: [[execution]]
  });
};

// Calculate next payment date based on subscription start and period
export const calculateNextPaymentDate = (
  startTimestamp: number,
  periodInSeconds: number,
  currentPaymentCount: number = 0
): Date => {
  const nextPaymentTimestamp = startTimestamp + (periodInSeconds * (currentPaymentCount + 1));
  return new Date(nextPaymentTimestamp * 1000);
};

// Format subscription period for display
export const formatSubscriptionPeriod = (periodInSeconds: number): string => {
  switch (periodInSeconds) {
    case SUBSCRIPTION_PERIODS.DAILY:
      return "Daily";
    case SUBSCRIPTION_PERIODS.WEEKLY:
      return "Weekly";
    case SUBSCRIPTION_PERIODS.MONTHLY:
      return "Monthly";
    case SUBSCRIPTION_PERIODS.YEARLY:
      return "Yearly";
    default:
      return "Custom";
  }
};

// Format ETH amount for display
export const formatEthAmount = (amountInWei: bigint): string => {
  const ethAmount = Number(amountInWei) / 1e18;
  return `${ethAmount.toFixed(ethAmount < 0.01 ? 6 : 2)} ETH`;
};

// Get transaction URL on Sepolia Etherscan
export const getTransactionUrl = (txHash: Hex): string => {
  return `${NETWORK_CONFIG.blockExplorer}/tx/${txHash}`;
};

// Get subscription status based on creation date, period, and max renewals
export const getSubscriptionStatus = (
  creationTimestamp: number,
  periodInSeconds: number,
  maxRenewals: number,
  currentPaymentCount: number = 0
): 'active' | 'expired' => {
  const now = Math.floor(Date.now() / 1000);
  const expirationTimestamp = creationTimestamp + (periodInSeconds * maxRenewals);
  
  return now < expirationTimestamp ? 'active' : 'expired';
};
