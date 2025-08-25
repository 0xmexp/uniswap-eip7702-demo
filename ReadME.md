# Uniswap EIP-7702 Demo

This project demonstrates how to delegate an EOA (Externally Owned Account) to a Uniswap smart wallet using the EIP-7702 standard, and how to perform various operations.

## Directory Structure
```
uniswap-eip7702-demo/
├── utils/
│   ├── walletClient.js           # Helpers for creating Sepolia wallet and public clients
│   └── transactionDebugger.js    # Utility functions for displaying transaction details
├── delegation.js                 # Basic script to delegate an EOA to the Uniswap smart wallet
├── delegationWithExecution.js    # Script to delegate and execute smart wallet operations
├── delegationWithCallPlanner.js  # Script to batch multiple operations using CallPlanner
├── removeDelegation.js           # Script to remove delegation by delegating to the zero address
├── checkDelegation.js            # Script to check if an address is delegated
├── package.json
└── .env                          # Required environment variables (ADDRESS, RPC_URL,PRIVATE_KEY)
```

## Install
```bash
npm install
```

## Usage

First, create an .env file and enter the required variables:

```
ADDRESS=wallet_address
PRIVATE_KEY=your_private_key
RPC_URL=your_sepolia_rpc_url
```

#### Delegate
```bash
node delegation.js
```

#### Delegate and Execute Operations
```bash
node delegationWithExecution.js
```

#### Batch Multiple Operations with CallPlanner
```bash
node delegationWithCallPlanner.js
```

#### Remove Delegation
```bash
node removeDelegation.js
```

#### Check Delegation Status
```bash
node checkDelegation.js
```

## License
MIT
