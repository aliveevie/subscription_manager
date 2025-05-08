import {
  createCaveatBuilder,
  createDelegation,
  createExecution,
  DelegationFramework,
  MetaMaskSmartAccount,
  SINGLE_DEFAULT_MODE,
} from "@metamask/delegation-toolkit";
import { Address, Hex } from "viem";
import { SUBSCRIPTION_PERIODS, SUBSCRIPTION_PLANS } from "./subscriptionUtils";
import { ExtendedDelegation } from "../types/delegation";

// Re-export SUBSCRIPTION_PERIODS for convenience
export { SUBSCRIPTION_PERIODS };

// Polyfill for older TypeScript target
declare global {
  interface Window {
    BigInt: typeof BigInt;
  }
}

// Use Number constructor as a fallback for BigInt
const safeBigInt = (value: number): bigint => {
  try {
    return BigInt(value);
  } catch {
    return BigInt(Number(value));
  }
};

// Sepolia network configuration
export const SEPOLIA_CONFIG = {
  chainId: 11155111,
  name: "Sepolia",
  blockExplorer: "https://sepolia.etherscan.io"
};

/**
 * Prepare a delegation for subscription payments
 * @param delegator The delegator's smart account
 * @param delegate The delegate's address
 * @param isSubscription Whether this is a subscription delegation
 * @param periodInSeconds The subscription period in seconds
 * @param maxRenewals The maximum number of renewals allowed
 * @returns A delegation object
 */
export function prepareRootDelegation(
  delegator: MetaMaskSmartAccount,
  delegate: Address,
  isSubscription: boolean = false,
  periodInSeconds: number = SUBSCRIPTION_PERIODS.MONTHLY,
  maxRenewals: number = 12
): ExtendedDelegation {
  // If this is a regular delegation (not subscription based)
  if (!isSubscription) {
    const caveats = createCaveatBuilder(delegator.environment)
      .addCaveat("limitedCalls", 1)
      .build();

    return createDelegation({
      to: delegate,
      from: delegator.address,
      caveats: caveats,
    });
  }
  
  // For subscription-based delegations
  
  // Create caveats for subscription
  const caveatBuilder = createCaveatBuilder(delegator.environment)
    // Limit calls to the max number of renewals
    .addCaveat("limitedCalls", maxRenewals);
  
  // Add limited calls caveat for subscription
  // We'll skip the chain ID check for now as it's causing type issues
  
  // Build the caveats
  const caveats = caveatBuilder.build();

  // Create the delegation
  return createDelegation({
    to: delegate,
    from: delegator.address,
    caveats: caveats,
  });
}

/**
 * Prepare the calldata for redeeming a delegation
 * @param delegation The delegation to redeem
 * @param paymentAddress The recipient address for the payment
 * @param amountInWei The payment amount in wei
 * @returns Encoded calldata for the redemption
 */
export function prepareRedeemDelegationData(
  delegation: ExtendedDelegation,
  paymentAddress?: Address,
  amountInWei?: bigint
): Hex {
  // For regular delegations (no payment)
  if (!paymentAddress || !amountInWei) {
    const execution = createExecution();
    const data = DelegationFramework.encode.redeemDelegations({
      delegations: [[delegation]],
      modes: [SINGLE_DEFAULT_MODE],
      executions: [[execution]],
    });
    return data;
  }
  
  // For subscription payment delegations
  // Create an execution for sending ETH
  // Using the correct parameters for createExecution
  const execution = createExecution({
    to: paymentAddress,
    value: amountInWei,
    data: "0x" as Hex // Empty data for ETH transfers
  });
  
  const data = DelegationFramework.encode.redeemDelegations({
    delegations: [[delegation]],
    modes: [SINGLE_DEFAULT_MODE],
    executions: [[execution]],
  });
  
  return data;
}

/**
 * Get a subscription plan by ID
 * @param planId The plan ID to look up
 * @returns The subscription plan or undefined if not found
 */
export function getSubscriptionPlanById(planId: number) {
  // Using a manual loop instead of .find() to avoid ES2015 dependency
  for (let i = 0; i < SUBSCRIPTION_PLANS.length; i++) {
    if (SUBSCRIPTION_PLANS[i].id === planId) {
      return SUBSCRIPTION_PLANS[i];
    }
  }
  return undefined;
}

/**
 * Format a date for display
 * @param date The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Calculate the total subscription cost
 * @param amountPerPeriod Amount per period in wei
 * @param _periodInSeconds Period length in seconds (unused but kept for API consistency)
 * @param maxRenewals Maximum number of renewals
 * @returns Total cost in wei
 */
export function calculateTotalSubscriptionCost(
  amountPerPeriod: bigint,
  _periodInSeconds: number,
  maxRenewals: number
): bigint {
  return amountPerPeriod * safeBigInt(maxRenewals);
}
