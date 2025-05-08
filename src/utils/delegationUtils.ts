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

// Subscription periods in seconds
export const SUBSCRIPTION_PERIODS = {
  DAILY: 60 * 60 * 24,
  WEEKLY: 60 * 60 * 24 * 7,
  MONTHLY: 60 * 60 * 24 * 30,
  YEARLY: 60 * 60 * 24 * 365
};

export function prepareRootDelegation(
  delegator: MetaMaskSmartAccount,
  delegate: Address,
  isSubscription: boolean = false,
  _periodInSeconds: number = SUBSCRIPTION_PERIODS.MONTHLY, // Prefix with underscore to indicate it's intentionally unused for now
  maxRenewals: number = 12
): Delegation {
  // If this is a regular delegation (not subscription based)
  if (!isSubscription) {
    // The following caveat enforcer is a simple example that limits
    // the number of executions the delegate can perform on the delegator's
    // behalf.
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
  // In a real implementation, we would use these values with a custom time-based caveat enforcer
  // const now = Math.floor(Date.now() / 1000);
  // const expiresAt = now + (_periodInSeconds * maxRenewals);
  
  // Create caveats for subscription
  const caveats = createCaveatBuilder(delegator.environment)
    // Limit calls to the max number of renewals
    .addCaveat("limitedCalls", maxRenewals)
    .build();
    
  // Note: The delegation toolkit doesn't have a built-in time-based caveat enforcer.
  // In a real app, we would implement a custom time-based caveat enforcer.

  return createDelegation({
    to: delegate,
    from: delegator.address,
    caveats: caveats,
  });
}

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
  const execution = createExecution();
  
  // In a real implementation, we would use execution.target = paymentAddress 
  // and execution.value = amountInWei to create a payment execution
  
  const data = DelegationFramework.encode.redeemDelegations({
    delegations: [[delegation]],
    modes: [SINGLE_DEFAULT_MODE],
    executions: [[execution]],
  });
  
  return data;
}
