export default function Hero() {
  return (
    <div className="hero">
      <h1 className="hero-title">
        <span className="hero-gradient-text">
          Professional <br />
          Subscription Payments
        </span>{" "}
        <span className="hero-emoji">💸</span>
      </h1>
      <div className="hero-subtitle">
        Complete Subscription Solution on Sepolia Network
      </div>
      <div className="hero-description">
        Create powerful subscription-based services with MetaMask Delegation Toolkit (ERC-7715) enabling automated recurring payments without repeated approvals
      </div>
      <div className="hero-features">
        <div className="feature">
          <span className="feature-icon">✓</span>
          <span className="feature-text">Multiple subscription tiers</span>
        </div>
        <div className="feature">
          <span className="feature-icon">✓</span>
          <span className="feature-text">Secure payment processing</span>
        </div>
        <div className="feature">
          <span className="feature-icon">✓</span>
          <span className="feature-text">Complete subscription management</span>
        </div>
      </div>
    </div>
  );
}
