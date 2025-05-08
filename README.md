# Subscription Manager: Professional Subscription Payments System

![Subscription Manager Banner](https://img.shields.io/badge/Subscription%20Manager-Professional%20Payments-blue)
![React](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?logo=typescript)
![Sepolia](https://img.shields.io/badge/Network-Sepolia-green)
![MetaMask](https://img.shields.io/badge/MetaMask-Delegation%20Toolkit-orange?logo=metamask)

## 🚀 Overview

Subscription Manager is a cutting-edge decentralized application that revolutionizes how businesses handle subscription-based services on the blockchain. Built on the Sepolia test network, this platform leverages the power of MetaMask Delegation Toolkit (ERC-7715) to enable automated recurring payments without requiring repeated user approvals.

### 💡 Key Features

- **Smart Account Integration**: Deploy personal smart contract accounts for enhanced security and delegation capabilities
- **Multiple Subscription Tiers**: Choose from various subscription plans with different pricing and features
- **Automated Recurring Payments**: Set up delegations for seamless subscription renewals
- **Complete Subscription Management**: View, modify, and cancel subscriptions with an intuitive dashboard
- **Secure Payment Processing**: Utilize blockchain technology for transparent and secure transactions

## 🔧 Technical Architecture

The Subscription Manager is built with a modern tech stack:

- **Frontend**: React 19 with TypeScript for type safety and enhanced developer experience
- **Blockchain Interaction**: 
  - Wagmi for React hooks to interact with Ethereum
  - Viem for low-level Ethereum interactions
  - Permissionless for account abstraction capabilities
- **Smart Account**: Implements ERC-4337 account abstraction for enhanced user experience
- **Delegation**: MetaMask Delegation Toolkit (ERC-7715) for secure payment authorizations
- **Network**: Sepolia test network for development and demonstration

### 🏗️ System Components

1. **Smart Account System**:
   - Delegator Smart Account: The primary account that authorizes payments
   - Delegate Smart Account: The service provider's account that can execute authorized payments

2. **Subscription Plans**:
   - Multiple tiers with varying prices and features
   - Support for different billing periods (monthly, yearly)
   - Discount options for longer subscription commitments

3. **Delegation Framework**:
   - Time-limited delegations for subscription periods
   - Usage-limited caveats to control maximum renewals
   - Secure signature verification for payment authorization

4. **Payment Processing**:
   - Automated recurring billing based on subscription terms
   - Transparent transaction history and receipt generation
   - Secure ETH transfers with proper error handling

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MetaMask browser extension
- Sepolia testnet ETH (available from faucets)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/aliveevie/subscription_manager.git
   cd subscription_manager
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   VITE_PIMLICO_API_KEY=your_pimlico_api_key
   ```
   Note: You can obtain a Pimlico API key from [pimlico.io](https://www.pimlico.io)

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

### Connecting to Sepolia

1. Configure MetaMask to connect to the Sepolia test network:
   - Network Name: Sepolia
   - Chain ID: 11155111
   - Currency Symbol: ETH

2. Get Sepolia testnet ETH from a faucet:
   - [Sepolia Faucet](https://sepoliafaucet.com/)
   - [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

## 💼 Usage Guide

### Creating a Subscription

1. **Connect Wallet**: Connect your MetaMask wallet to the application
2. **Choose Account Type**: Select between Smart Account (recommended) or Regular Account
3. **Deploy Delegator**: If using Smart Account, deploy your delegator contract
4. **Create Delegate**: Set up the delegate account for the service provider
5. **Select Subscription Plan**: Choose from available subscription tiers
6. **Confirm Subscription**: Authorize the delegation for recurring payments
7. **Manage Subscription**: View and manage your active subscriptions

### Managing Subscriptions

The subscription management dashboard allows you to:
- View active subscription details
- See upcoming payment dates
- Track payment history
- Modify subscription tier
- Cancel subscription

## 🧪 Testing

The application includes comprehensive testing:

```bash
# Run tests
npm run test
# or
yarn test
```

## 🛠️ Development

### Build for Production

```bash
npm run build
# or
yarn build
```

### Preview Production Build

```bash
npm run preview
# or
yarn preview
```

## 🔍 Technical Deep Dive

### Account Abstraction

The application leverages ERC-4337 account abstraction to improve user experience by:
- Removing the need for ETH to pay for gas (optional paymaster integration)
- Enabling batched transactions for efficient operations
- Supporting advanced authorization mechanisms

### Delegation Mechanism

The MetaMask Delegation Toolkit (ERC-7715) provides a secure way to authorize recurring payments:
- Delegations include caveats that limit when and how they can be used
- Time-based caveats ensure subscriptions expire appropriately
- Usage-count caveats limit the number of payment executions
- Amount caveats restrict the maximum payment value

### Subscription Logic

The core subscription functionality includes:
- Period calculations for different subscription intervals
- Automatic renewal processing based on delegation terms
- Status tracking for active and expired subscriptions
- Secure payment execution through delegated transactions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [MetaMask Delegation Toolkit](https://github.com/MetaMask/delegation-toolkit)
- [Wagmi](https://wagmi.sh/)
- [Viem](https://viem.sh/)
- [Permissionless.js](https://docs.pimlico.io/permissionless)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)