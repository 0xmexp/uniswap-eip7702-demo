require('dotenv').config();
const { createSepoliaWalletClient, createSepoliaPublicClient } = require('./utils/walletClient');

/**
 * This script demonstrates how to remove delegation from an EOA by using
 * EIP-7702 Type-4 transactions to delegate to the zero address.
 */
async function removeDelegation() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error('PRIVATE_KEY is required in .env');

  // Create wallet and public clients for Sepolia network
  const { walletClient } = createSepoliaWalletClient(privateKey);
  const publicClient = createSepoliaPublicClient();

  const zeroAddress = "0x0000000000000000000000000000000000000000";
  console.log('Removing delegation by delegating to zero address:', zeroAddress);

  // STEP 1: Sign the EIP-7702 Authorization for Zero Address
  let authorization;
  try {
    authorization = await walletClient.signAuthorization({
      executor: "self",
      contractAddress: zeroAddress,
    });
    console.log('EIP-7702 Authorization for zero address signed:', authorization);
  } catch (error) {
    console.error('Error signing EIP-7702 authorization for zero address:', error);
    return;
  }

  // STEP 2: Send the EIP-7702 Type-4 Transaction
  try {
    const hash = await walletClient.sendTransaction({
      authorizationList: [authorization],
      to: walletClient.account.address,
      data: '0x',
    });
    console.log(`EIP-7702 Type-4 remove delegation transaction sent: https://sepolia.etherscan.io/tx/${hash}`);
  } catch (error) {
    console.error('Error sending EIP-7702 remove delegation transaction:', error);
  }
}

removeDelegation().catch(console.error);
