import { Delegation as BaseDelegation } from "@metamask/delegation-toolkit";

// Extended Delegation type with metadata
export interface ExtendedDelegation extends Omit<BaseDelegation, 'signature'> {
  metadata?: {
    isSubscription?: boolean;
    planId?: number;
    period?: number;
    maxRenewals?: number;
    currentRenewals?: number;
    createdAt?: number;
  };
  signature?: `0x${string}`;
}

// Re-export the base type for convenience
export type { BaseDelegation as Delegation };
