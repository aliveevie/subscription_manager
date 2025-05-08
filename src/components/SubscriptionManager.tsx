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
import { Hex } from "viem";
import "./SubscriptionManager.css";

export default function SubscriptionManager() {
  const { isConnected, address } = useAccount();
  const { smartAccount } = useDelegateSmartAccount();
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
  
  // Merchant address - in a real app, this would be the service provider's address
  const merchantAddress = address as `0x${string}` || "0x0000000000000000000000000000000000000000";
  
  useEffect(() => {
    // In a real app, you would fetch payment history from a backend or blockchain
    // This is just a placeholder for demonstration
  }, []);
  
  const handleProcessPayment = async () => {
    if (!isConnected || !smartAccount || !bundlerClient || !pimlicoClient) {
      setError("Wallet not connected or services not available");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get the delegation
      const delegation = getDelegation(smartAccount.address);
      
      if (!delegation || !delegation.metadata) {
        throw new Error("No active subscription found");
      }
      
      const { planId, currentRenewals = 0 } = delegation.metadata;
      
      // Get the plan details
      const plan = getSubscriptionPlanById(planId);
      
      if (!plan) {
        throw new Error("Subscription plan not found");
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
        account: smartAccount,
        calls: [
          {
            to: smartAccount.environment.DelegationManager,
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
      delegation.metadata.currentRenewals = currentRenewals + 1;
      
      console.log("Payment processed successfully:", receipt);
    } catch (err) {
      console.error("Error processing payment:", err);
      setError(`Failed to process payment: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const getSubscriptionDetails = () => {
    if (!smartAccount) return null;
    
    const delegation = getDelegation(smartAccount.address);
    if (!delegation || !delegation.metadata) return null;
    
    const { planId } = delegation.metadata;
    return getSubscriptionPlanById(planId);
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
