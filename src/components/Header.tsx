import { useAccount, useDisconnect, useChainId } from "wagmi";
import { useAccountAbstractionUtils } from "@/hooks/useAccountAbstractionUtils";
import ConnectButton from "./ConnectButton";
import "./Header.css";

export default function Header() {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { isCorrectNetwork, switchToSepolia, isNetworkSwitching, targetChain } = useAccountAbstractionUtils();

  // Format address for display (0x1234...5678)
  const formatAddress = (address: string | undefined) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleDisconnect = () => {
    disconnect();
    // Reload the page to reset the application state
    window.location.reload();
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo">
          <span className="logo-text">Subscription Manager</span>
          <span className="logo-badge">Sepolia</span>
        </div>
        <div className="wallet-section">
          {isConnected && address ? (
            <>
              <div className="wallet-info">
                <div className="wallet-address">
                  {formatAddress(address)}
                </div>
                <div className="network-indicator">
                  <span className={`network-dot ${isCorrectNetwork ? 'correct' : 'wrong'}`}></span>
                  <span className="network-name">
                    {isCorrectNetwork ? 'Sepolia' : `Wrong Network (${chainId})`}
                  </span>
                </div>
              </div>
              
              {!isCorrectNetwork && (
                <button 
                  className="network-switch-button" 
                  onClick={switchToSepolia}
                  disabled={isNetworkSwitching}
                >
                  {isNetworkSwitching ? 'Switching...' : `Switch to Sepolia`}
                </button>
              )}
              
              <button 
                className="disconnect-button" 
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
            </>
          ) : (
            <ConnectButton />
          )}
        </div>
      </div>
    </header>
  );
}
