import { useState, useEffect } from "react";
import useDelegateSmartAccount from "@/hooks/useDelegateSmartAccount";
import useStorageClient from "@/hooks/useStorageClient";
import CreateSubscriptionButton from "./CreateSubscriptionButton";
import ProcessSubscriptionButton from "./ProcessSubscriptionButton";
import "./SubscriptionService.css";

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: string;
  period: string;
}

// Simulated service provider address - in a real app, this would be the business's wallet address
const SERVICE_PROVIDER_ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

export default function SubscriptionService() {
  const { smartAccount: delegateAccount } = useDelegateSmartAccount();
  const { getDelegation } = useStorageClient();
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const plans: SubscriptionPlan[] = [
    {
      id: 1,
      name: "Basic Plan",
      description: "Access to basic content and features",
      price: "0.01 ETH",
      period: "Monthly"
    },
    {
      id: 2,
      name: "Premium Plan",
      description: "Access to premium content plus extras",
      price: "0.05 ETH",
      period: "Monthly"
    },
    {
      id: 3,
      name: "Annual Plan",
      description: "Full access with annual savings",
      price: "0.5 ETH",
      period: "Yearly"
    }
  ];

  // Check if the user already has an active subscription
  useEffect(() => {
    if (delegateAccount) {
      const delegation = getDelegation(delegateAccount.address);
      if (delegation) {
        setIsSubscribed(true);
        
        // Find which plan they're subscribed to (in a real app, this would be stored with the delegation)
        // For demo purposes, we'll just set it to the first plan
        setCurrentPlan(plans[0]);
      }
    }
  }, [delegateAccount, getDelegation]);

  const selectPlan = (planId: number) => {
    setSelectedPlan(planId);
    // Find the selected plan details
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setCurrentPlan(plan);
    }
  };

  const handleSubscriptionSuccess = () => {
    setIsSubscribed(true);
    setError(null);
  };

  const handleSubscriptionError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handlePaymentSuccess = () => {
    setError(null);
    // Display success message or update UI as needed
    alert("Payment processed successfully!");
  };

  return (
    <div className="subscription-container">
      <h2 className="subscription-title">MetaMask Subscription Service</h2>
      <p className="subscription-description">
        Subscribe to our service using MetaMask delegated payments.
        Your subscription will automatically renew without requiring approval each time.
      </p>
      
      {!isSubscribed ? (
        <>
          <div className="subscription-plans">
            {plans.map((plan) => (
              <div 
                key={plan.id} 
                className={`plan-card ${selectedPlan === plan.id ? 'plan-selected' : ''}`}
                onClick={() => selectPlan(plan.id)}
              >
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
                <div className="plan-price">{plan.price}</div>
                <div className="plan-period">{plan.period}</div>
              </div>
            ))}
          </div>
          
          {selectedPlan && currentPlan && (
            <CreateSubscriptionButton 
              planId={currentPlan.id}
              planName={currentPlan.name}
              planPrice={currentPlan.price}
              planPeriod={currentPlan.period}
              onSuccess={handleSubscriptionSuccess}
            />
          )}
        </>
      ) : (
        <div className="subscription-active">
          <div className="subscription-success">
            <h3>Your subscription is active!</h3>
            <p>
              {currentPlan ? (
                <>You are currently subscribed to the <strong>{currentPlan.name}</strong> at <strong>{currentPlan.price}</strong> per {currentPlan.period.toLowerCase()} period.</>
              ) : (
                <>Your subscription has been activated using MetaMask delegation.</>
              )}
            </p>
          </div>
          
          <div className="subscription-management">
            <h3>Subscription Management</h3>
            <p>As a service provider, you can process the next payment using the button below:</p>
            
            {currentPlan && (
              <ProcessSubscriptionButton 
                serviceAddress={SERVICE_PROVIDER_ADDRESS}
                planPrice={currentPlan.price}
                onSuccess={handlePaymentSuccess}
                onError={handleSubscriptionError}
              />
            )}
          </div>
        </div>
      )}
      
      {error && (
        <div className="subscription-error">
          {error}
        </div>
      )}
    </div>
  );
}
