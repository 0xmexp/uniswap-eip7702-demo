require('dotenv').config();
const { SmartWallet, SupportedChainIds, SMART_WALLET_ADDRESSES } = require('@uniswap/smart-wallet-sdk');
const { createSepoliaWalletClient } = require('./utils/walletClient');

/**
 * EIP-7702 Delegation Script
 * 
 * This script demonstrates how to delegate an EOA (Externally Owned Account) 
 * to a Uniswap smart wallet using EIP-7702 Type-4 transactions.
 * 
 * EIP-7702 allows an EOA to temporarily act as a smart contract wallet
 * by including an authorizationList in the transaction.
 */
async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error('PRIVATE_KEY is required in .env');

  // Create wallet client for Sepolia network
  const { walletClient } = createSepoliaWalletClient(privateKey);

  // This is the contract that your EOA will be delegated to
  const uniswapSmartWalletAddress = SMART_WALLET_ADDRESSES[SupportedChainIds.SEPOLIA];
  console.log('Sepolia Smart Wallet Contract Address:', uniswapSmartWalletAddress);

  // ===== STEP 1: Sign the EIP-7702 Authorization =====
  // This creates the authorizationList that will be included in the Type-4 transaction
  let authorization;
  try {
    authorization = await walletClient.signAuthorization({
      executor: "self",
      contractAddress: uniswapSmartWalletAddress,
    });
    console.log('EIP-7702 Authorization signed:', authorization);
  } catch (error) {
    console.error('Error signing EIP-7702 authorization:', error);
    return;
  }

  // ===== STEP 2: Send the EIP-7702 Type-4 Transaction =====
  //
  // This is a Type-4 transaction (EIP-7702) that:
  // - Includes the authorizationList with your signed authorization
  // - Sends the transaction to your own address
  try {
    const hash = await walletClient.sendTransaction({
      authorizationList: [authorization],
      to: walletClient.account.address,
      data: '0x',
    });
    console.log(`EIP-7702 Type-4 delegation transaction sent: https://sepolia.etherscan.io/tx/${hash}`);
    console.log('Your EOA is now being upgraded to a smart wallet...');
  } catch (error) {
    console.error('Error sending EIP-7702 delegation transaction:', error);
  }
}

main().catch(console.error);
