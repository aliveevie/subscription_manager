import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import useDelegateSmartAccount from "@/hooks/useDelegateSmartAccount";
import useStorageClient from "@/hooks/useStorageClient";
import { useAccountAbstractionUtils } from "@/hooks/useAccountAbstractionUtils";
import { prepareRedeemDelegationData, getSubscriptionPlanById } from "@/utils/delegationUtils";
import { 
  formatEthAmount, 
  formatSubscriptionPeriod,
  getTransactionUrl
} from "@/utils/subscriptionUtils";
import { ExtendedDelegation } from "@/types/delegation";
import { Hex } from "viem";
import "./SubscriptionManager.css";

export default function SubscriptionManager() {
  const { isConnected, address } = useAccount();
  const { smartAccount: delegateSmartAccount } = useDelegateSmartAccount();
  const { getDelegation } = useStorageClient();
  const { bundlerClient, paymasterClient, pimlicoClient } = useAccountAbstractionUtils();
  
  const [loading, setLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<Hex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Array<{
    date: Date;
    amount: bigint;
    txHash: Hex;
  }>>([]);
  
  // State for regular wallet subscriptions
  const [regularWalletSubscription, setRegularWalletSubscription] = useState<{
    planId: number;
    startDate: number;
    period: number;
    maxRenewals: number;
    currentRenewals: number;
  } | null>(null);
  
  // Merchant address - in a real app, this would be the service provider's address
  const merchantAddress = address as `0x${string}` || "0x0000000000000000000000000000000000000000";
  
  useEffect(() => {
    // Check for smart account subscriptions
    if (delegateSmartAccount) {
      const delegation = getDelegation(delegateSmartAccount.address) as ExtendedDelegation;
      if (delegation && delegation.metadata) {
        console.log("Found smart account subscription", delegation.metadata);
      }
    }
    
    // Check for regular wallet subscriptions in localStorage
    if (address) {
      // Look for subscriptions in localStorage that match this address
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sub_')) {
            const subData = JSON.parse(localStorage.getItem(key) || '{}');
            if (subData.address === address) {
              console.log("Found regular wallet subscription", subData);
              setRegularWalletSubscription({
                planId: subData.planId,
                startDate: subData.createdAt,
                period: subData.period,
                maxRenewals: subData.maxRenewals,
                currentRenewals: subData.currentRenewals || 0
              });
              break;
            }
          }
        }
      } catch (err) {
        console.error("Error checking for regular wallet subscriptions:", err);
      }
    }
  }, [address, delegateSmartAccount, getDelegation]);
  
  const handleProcessPayment = async () => {
    if (!isConnected) {
      setError("Wallet not connected");
      return;
    }
    
    // Check if we have a smart account subscription or a regular wallet subscription
    const hasSmartAccountSubscription = delegateSmartAccount && (getDelegation(delegateSmartAccount.address) as ExtendedDelegation)?.metadata;
    const hasRegularWalletSubscription = regularWalletSubscription !== null;
    
    if (!hasSmartAccountSubscription && !hasRegularWalletSubscription) {
      setError("No active subscription found");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Handle different subscription types
      if (delegateSmartAccount && hasSmartAccountSubscription) {
        // Smart account subscription flow
        // Get the delegation
        const delegation = getDelegation(delegateSmartAccount.address) as ExtendedDelegation;
        
        if (!delegation || !delegation.metadata) {
          throw new Error("No active smart account subscription found");
        }
        
        const { planId, currentRenewals = 0 } = delegation.metadata;
        
        // Get the plan details
        const plan = getSubscriptionPlanById(planId);
        
        if (!plan) {
          throw new Error("Subscription plan not found");
        }
        
        // Check if we have the necessary services
        if (!bundlerClient || !pimlicoClient || !paymasterClient) {
          throw new Error("Smart account services not available. Please ensure you're on the Sepolia network.");
        }
        
        // Prepare the redemption data for the payment
        const redeemData = prepareRedeemDelegationData(
          delegation,
          merchantAddress,
          plan.price
        );
        
        // Get gas price from Pimlico
        const { fast: fee } = await pimlicoClient.getUserOperationGasPrice();
        
        // Send the user operation
        const userOperationHash = await bundlerClient.sendUserOperation({
          account: delegateSmartAccount,
          calls: [
            {
              to: delegateSmartAccount.environment.DelegationManager,
              data: redeemData,
            },
          ],
          ...fee,
          paymaster: paymasterClient,
        });
        
        // Wait for the receipt
        const { receipt } = await bundlerClient.waitForUserOperationReceipt({
          hash: userOperationHash,
        });
        
        // Update transaction hash
        setTransactionHash(receipt.transactionHash);
        
        // Update payment history
        setPaymentHistory(prev => [
          {
            date: new Date(),
            amount: plan.price,
            txHash: receipt.transactionHash
          },
          ...prev
        ]);
        
        // Update delegation metadata with incremented renewal count
        if (delegation.metadata) {
          delegation.metadata.currentRenewals = currentRenewals + 1;
        }
        
        console.log("Payment processed successfully with smart account:", receipt);
      } else if (regularWalletSubscription) {
        // Regular wallet subscription flow
        // For demo purposes, we'll simulate a successful payment
        console.log("Processing regular wallet subscription payment");
        
        // Get the plan details
        const plan = getSubscriptionPlanById(regularWalletSubscription.planId);
        
        if (!plan) {
          throw new Error("Subscription plan not found");
        }
        
        // Generate a mock transaction hash for demo purposes
        const mockTxHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}` as Hex;
        
        // Update transaction hash
        setTransactionHash(mockTxHash);
        
        // Update payment history
        setPaymentHistory(prev => [
          {
            date: new Date(),
            amount: plan.price,
            txHash: mockTxHash
          },
          ...prev
        ]);
        
        // Update regular wallet subscription with incremented renewal count
        const updatedSubscription = {
          ...regularWalletSubscription,
          currentRenewals: regularWalletSubscription.currentRenewals + 1
        };
        setRegularWalletSubscription(updatedSubscription);
        
        // Update the subscription in localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sub_')) {
            const subData = JSON.parse(localStorage.getItem(key) || '{}');
            if (subData.address === address) {
              subData.currentRenewals = updatedSubscription.currentRenewals;
              localStorage.setItem(key, JSON.stringify(subData));
              break;
            }
          }
        }
        
        console.log("Payment processed successfully with regular wallet");
      }
    } catch (err) {
      console.error("Error processing payment:", err);
      setError(`Failed to process payment: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const getSubscriptionDetails = () => {
    // Check for active subscription
    if (delegateSmartAccount) {
      const delegation = getDelegation(delegateSmartAccount.address) as ExtendedDelegation;
      if (delegation && delegation.metadata) {
        const { planId } = delegation.metadata;
        return getSubscriptionPlanById(planId);
      }
    }
    
    // If no smart account subscription, check for regular wallet subscription
    if (regularWalletSubscription) {
      return getSubscriptionPlanById(regularWalletSubscription.planId);
    }
    
    return null;
  };
  
  return (
    <div className="subscription-manager">
      <h2>Subscription Payment Manager</h2>
      <p className="manager-description">
        Process subscription payments for your active subscription on the Sepolia network.
      </p>
      
      <div className="manager-content">
        <div className="payment-section">
          <h3>Process Payment</h3>
          
          {getSubscriptionDetails() ? (
            <div className="payment-details">
              <div className="payment-info">
                <div className="info-item">
                  <span className="info-label">Plan:</span>
                  <span className="info-value">{getSubscriptionDetails()?.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Amount:</span>
                  <span className="info-value">{formatEthAmount(getSubscriptionDetails()?.price || BigInt(0))}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Billing Cycle:</span>
                  <span className="info-value">{formatSubscriptionPeriod(getSubscriptionDetails()?.period || 0)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Network:</span>
                  <span className="info-value">Sepolia</span>
                </div>
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              {transactionHash ? (
                <div className="transaction-success">
                  <div className="success-icon">✓</div>
                  <h4>Payment Successful!</h4>
                  <p>Your subscription payment has been processed.</p>
                  <a 
                    href={getTransactionUrl(transactionHash)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="view-tx-button"
                  >
                    View Transaction
                  </a>
                  <button 
                    className="new-payment-button"
                    onClick={() => setTransactionHash(null)}
                  >
                    Process Another Payment
                  </button>
                </div>
              ) : (
                <button 
                  className="process-button"
                  onClick={handleProcessPayment}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Process Subscription Payment"}
                </button>
              )}
              
              <div className="payment-note">
                <p>
                  <strong>Note:</strong> This is a demonstration on the Sepolia test network. In a production environment, 
                  payments would be processed automatically by the merchant at regular intervals without requiring manual action.
                </p>
              </div>
            </div>
          ) : (
            <div className="no-subscription">
              <p>No active subscription found. Please subscribe to a plan first.</p>
            </div>
          )}
        </div>
        
        <div className="history-section">
          <h3>Payment History</h3>
          
          {paymentHistory.length > 0 ? (
            <div className="history-table">
              <div className="table-header">
                <div className="header-cell">Date</div>
                <div className="header-cell">Amount</div>
                <div className="header-cell">Transaction</div>
              </div>
              
              {paymentHistory.map((payment, index) => (
                <div className="table-row" key={index}>
                  <div className="table-cell">{payment.date.toLocaleDateString()}</div>
                  <div className="table-cell">{formatEthAmount(payment.amount)}</div>
                  <div className="table-cell">
                    <a 
                      href={getTransactionUrl(payment.txHash)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-history">No payment history available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
