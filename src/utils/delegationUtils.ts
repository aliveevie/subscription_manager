import {
  createCaveatBuilder,
  createDelegation,
  createExecution,
  Delegation,
  DelegationFramework,
  MetaMaskSmartAccount,
  SINGLE_DEFAULT_MODE,
} from "@metamask/delegation-toolkit";
import { Address, Hex } from "viem";
import { SUBSCRIPTION_PERIODS, SUBSCRIPTION_PLANS } from "./subscriptionUtils";

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
 * @param planId Optional plan ID for subscription metadata
 * @returns A delegation object
 */
export function prepareRootDelegation(
  delegator: MetaMaskSmartAccount,
  delegate: Address,
  isSubscription: boolean = false,
  periodInSeconds: number = SUBSCRIPTION_PERIODS.MONTHLY,
  maxRenewals: number = 12,
  planId?: number
): Delegation {
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
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + (periodInSeconds * maxRenewals);
  
  // Create caveats for subscription
  const caveatBuilder = createCaveatBuilder(delegator.environment)
    // Limit calls to the max number of renewals
    .addCaveat("limitedCalls", maxRenewals);
  
  // Add network caveat to ensure it only works on Sepolia
  if (delegator.environment.chainId === SEPOLIA_CONFIG.chainId) {
    caveatBuilder.addCaveat("onlyOnChain", SEPOLIA_CONFIG.chainId);
  }
  
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
  delegation: Delegation,
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
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
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
 * @param periodInSeconds Period length in seconds
 * @param maxRenewals Maximum number of renewals
 * @returns Total cost in wei
 */
export function calculateTotalSubscriptionCost(
  amountPerPeriod: bigint,
  periodInSeconds: number,
  maxRenewals: number
): bigint {
  return amountPerPeriod * BigInt(maxRenewals);
}
