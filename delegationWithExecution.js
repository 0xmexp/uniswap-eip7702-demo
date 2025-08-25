require('dotenv').config();
const { SmartWallet, SupportedChainIds, SMART_WALLET_ADDRESSES } = require('@uniswap/smart-wallet-sdk');
const { createSepoliaWalletClient } = require('./utils/walletClient');
const { 
  displayTransactionDetails, 
  displayExecutionCallDetails, 
  displayMethodParameters 
} = require('./utils/transactionDebugger');

/**
 * EIP-7702 Delegation with Execution Script
 * 
 * This script demonstrates how to delegate an EOA to a Uniswap smart wallet
 * AND execute smart wallet operations in the same transaction
 * 
 * Instead of just delegating (data: '0x'), we use the data field to:
 * - Execute batched calls through the smart wallet
 */
async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error('PRIVATE_KEY is required in .env');

  // Create wallet client sfor Sepolia network
  const { walletClient, account } = createSepoliaWalletClient(privateKey);

  const uniswapSmartWalletAddress = SMART_WALLET_ADDRESSES[SupportedChainIds.SEPOLIA];
  console.log('Sepolia Smart Wallet Contract Address:', uniswapSmartWalletAddress);

  // ===== STEP 1: Prepare Smart Wallet Operations =====
  //
  // We'll create some example calls to execute through the smart wallet.
  // These could be any contract interactions you want to perform.
  
  // Example: A simple ETH transfer call (0 ETH, just for demonstration)
  const exampleCalls = [
    {
      to: account.address, // Send to yourself (just for demo)
      value: 0n,           // 0 ETH
      data: '0x'           // No function call, just a transfer
    }
  ];
  
  console.log('Preparing smart wallet calls:', exampleCalls);

  // ===== STEP 2: Encode the Smart Wallet Operations =====  
  let methodParameters;
  try {
    methodParameters = SmartWallet.encodeBatchedCall(exampleCalls, {
      revertOnFailure: true
    });
    console.log('Encoded method parameters:', methodParameters);
    displayMethodParameters(methodParameters);
  } catch (error) {
    console.error('Error encoding smart wallet calls:', error);
    return;
  }

  // ===== STEP 3: Create the Execution Call ===== 
  let executionCall;
  try {
    executionCall = SmartWallet.createExecute(methodParameters, SupportedChainIds.SEPOLIA);
    console.log('Execution call created:', executionCall);
    displayExecutionCallDetails(executionCall);
  } catch (error) {
    console.error('Error creating execution call:', error);
    return;
  }

  // ===== STEP 4: Sign the EIP-7702 Authorization =====
  //
  // Create authorization for the smart wallet contract 
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

  // ===== STEP 5: Send the EIP-7702 Transaction =====  
  try {
    const hash = await walletClient.sendTransaction({
      authorizationList: [authorization],
      to: walletClient.account.address,
      data: executionCall.data,
      value: executionCall.value || 0n,
    });
    
    console.log('\n=== TRANSACTION SENT ===');
    console.log(`EIP-7702 Type-4 delegation + execution transaction sent: https://sepolia.etherscan.io/tx/${hash}`);
    console.log('Your EOA is now delegated AND executing smart wallet operations!');
    console.log('\nWhat happened:');
    console.log('1. ✅ EOA delegated to smart wallet');
    console.log('2. ✅ Smart wallet executed the batched calls');    
  } catch (error) {
    console.error('Error sending EIP-7702 delegation + execution transaction:', error);
  }
}

main().catch(console.error);
