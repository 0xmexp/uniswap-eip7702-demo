require('dotenv').config();
const { SmartWallet, SupportedChainIds, SMART_WALLET_ADDRESSES, CallPlanner } = require('@uniswap/smart-wallet-sdk');
const { createSepoliaWalletClient } = require('./utils/walletClient');
const { encodeAbiParameters, parseAbiParameters } = require('viem');
const { 
  displayTransactionDetails, 
  displayExecutionCallDetails, 
  displayMethodParameters 
} = require('./utils/transactionDebugger');


/**
 * EIP-7702 Delegation with CallPlanner Script
 * 
 * 1. Initialize a CallPlanner to batch multiple contract calls
 * 2. Add calls to the planner
 * 3. Encode calls using SmartWallet.encodeBatchedCall
 * 4. Create execute call using SmartWallet.createExecute
 * 5. Delegate EOA and execute the batched calls via EIP-7702
 */
async function main() {

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error('PRIVATE_KEY is required in .env');

  // Create wallet client for Sepolia network
  const { walletClient, account } = createSepoliaWalletClient(privateKey);

  // Get the Sepolia smart wallet contract address
  const uniswapSmartWalletAddress = SMART_WALLET_ADDRESSES[SupportedChainIds.SEPOLIA];
  console.log('Sepolia Smart Wallet Contract Address:', uniswapSmartWalletAddress);

  // ===== STEP 1: Initialize CallPlanner and Add Calls ===== 
  console.log('\n=== STEP 1: Initializing CallPlanner ===');
  const planner = new CallPlanner();
  
  // UNI token contract address on Sepolia
  const tokenContractAddress = '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984';

  const routerAddress = '0x3a9d48ab9751398bbfa63ad67599bb04e4bdf98b';

  // WETH token contract address on Sepolia
  const wethAddress = '0xfff9976782d46cc05630d1f6ebab18b2324d6b14';
  
  // Swap parameters
  const swapAmountIn = 10000000000000n; // 0.00001 ETH in wei
  const minAmountOut = 0n; // 0 slippage
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400); // 24 hours from now

  // Universal Router V2 commands: 0x0b000604 (WRAP_ETH, V3_SWAP_EXACT_IN, PAY_PORTION, SWEEP)
  const commands = '0x0b000604';

  // Command-1: WRAP_ETH input: recipient = 0x2, amount = swapAmountIn
  const wrapRecipient = '0x0000000000000000000000000000000000000002';
  const wrapAmount = swapAmountIn.toString();
  const wrapInput = encodeAbiParameters(
    parseAbiParameters('address recipient, uint256 amount'),
    [wrapRecipient, wrapAmount]
  );

  // Command-2: V3_SWAP_EXACT_IN (address recipient, uint256 amountIn, uint256 amountOutMin, bytes path, bool payerIsUser)
  const swapRecipient = '0x0000000000000000000000000000000000000002';
  const swapAmountInStr = swapAmountIn.toString();
  const swapAmountOutMinStr = minAmountOut.toString();
  const path = '0xfff9976782d46cc05630d1f6ebab18b2324d6b14000064' + tokenContractAddress.slice(2);
  const payerIsUser = false;
  const swapInput = encodeAbiParameters(
    parseAbiParameters('address recipient, uint256 amountIn, uint256 amountOutMin, bytes path, bool payerIsUser'),
    [swapRecipient, swapAmountInStr, swapAmountOutMinStr, path, payerIsUser]
  );

  // Command-3: PAY_PORTION (address token, address recipient, uint256 bips)
  const payPortionToken = tokenContractAddress;
  const payPortionRecipient = '0xE49ACc3B16c097ec88Dc9352CE4Cd57aB7e35B95';
  const payPortionBips = '25';
  const payPortionInput = encodeAbiParameters(
    parseAbiParameters('address token, address recipient, uint256 bips'),
    [payPortionToken, payPortionRecipient, payPortionBips]
  );

  // Command-4: SWEEP (address token, address recipient, uint256 amountMin)
  const sweepToken = tokenContractAddress;
  const sweepRecipient = account.address;
  const sweepAmountMin = '0x55cac6f246';
  const sweepInput = encodeAbiParameters(
    parseAbiParameters('address token, address recipient, uint256 amountMin'),
    [sweepToken, sweepRecipient, sweepAmountMin]
  );

  const inputsArray = [wrapInput, swapInput, payPortionInput, sweepInput];

  // Universal Router execute(bytes,bytes[],uint256) selector
  const universalRouterSelector = '0x3593564c';
  // ABI encode (bytes commands, bytes[] inputs, uint256 deadline)
  const encoded = encodeAbiParameters(
    parseAbiParameters('bytes commands, bytes[] inputs, uint256 deadline'),
    [commands, inputsArray, deadline]
  );
  const swapCalldata = universalRouterSelector + encoded.slice(2);
  console.log('Universal Router swapCalldata:', swapCalldata);

  console.log('\nAdding ETH → UNI swap call:');
  console.log('- Router Contract:', routerAddress);
  console.log('- Input Token (WETH):', wethAddress);
  console.log('- Output Token (UNI):', tokenContractAddress);
  console.log('- Input Amount:', swapAmountIn.toString(), 'wei (0.00001 ETH)');
  console.log('- Swap Calldata:', swapCalldata);

  planner.add(
    routerAddress,
    swapAmountIn,
    swapCalldata
  );
  
  console.log('\nCallPlanner initialized with', planner.calls.length, 'calls');
  console.log('Total ETH value required:', planner.value.toString(), 'wei');

  // STEP 2: Encode calls using SmartWallet
  console.log('\n=== STEP 2: Encoding Calls with SmartWallet ===');
  
  let methodParameters;
  try {
    methodParameters = SmartWallet.encodeBatchedCall(planner.calls, {
      revertOnFailure: true
    });
    console.log('Encoded method parameters:', methodParameters);
    displayMethodParameters(methodParameters);
  } catch (error) {
    console.error('Error encoding smart wallet calls:', error);
    return;
  }

  // STEP 3: Create execute call
  console.log('\n=== STEP 3: Creating Execute Call ===');
  
  let executionCall;
  try {
    executionCall = SmartWallet.createExecute(methodParameters, SupportedChainIds.SEPOLIA);
    console.log('Execution call created:', executionCall);
    displayExecutionCallDetails(executionCall);
  } catch (error) {
    console.error('Error creating execution call:', error);
    return;
  }

  // STEP 4: Sign EIP-7702 authorization
  console.log('\n=== STEP 4: Signing EIP-7702 Authorization ===');
  
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

  // STEP 5: Send EIP-7702 transaction
  // This Type-4 transaction delegates your EOA and executes the batched calls
  console.log('\n=== STEP 5: Sending EIP-7702 Transaction ===');
  
  const eip7702Transaction = {
    authorizationList: [authorization],
    to: walletClient.account.address,
    data: executionCall.data,
    value: executionCall.value || 0n,
  };
  
  // Display transaction details before sending
  displayTransactionDetails(eip7702Transaction, authorization);

  // Send the transaction
  try {
    const hash = await walletClient.sendTransaction(eip7702Transaction);

    console.log('\n=== TRANSACTION SENT ===');
    console.log(`EIP-7702 Type-4 transaction sent: https://sepolia.etherscan.io/tx/${hash}`);
    console.log('Your EOA is now delegated AND executing smart wallet operations!');
    console.log('\nWhat happened:');
    console.log('1. ✅ EOA delegated to smart wallet');
    console.log('2. ✅ CallPlanner batched multiple contract calls');
    console.log('3. ✅ Smart wallet executed the batched calls');

  } catch (error) {
    console.error('Error sending EIP-7702 transaction:', error);
  }
}

main().catch(console.error);
