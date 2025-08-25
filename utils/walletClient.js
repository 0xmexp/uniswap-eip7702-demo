const { createWalletClient, createPublicClient, http } = require('viem');
const { sepolia } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

/**
 * Create a wallet client for Sepolia network
 * @param {string} privateKey - The private key for the account
 * @param {string} rpcUrl - Optional custom RPC URL (defaults to Alchemy Sepolia)
 * @returns {Object} The wallet client and account
 */
function createSepoliaWalletClient(privateKey, rpcUrl = null) {
  const defaultRpcUrl = 'https://eth-sepolia.g.alchemy.com/v2/1mD9crsR21kE_lM0gFgLbzQ0JBY0CcyI';
  const finalRpcUrl = rpcUrl || process.env.RPC_URL || defaultRpcUrl;
  
  const account = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(finalRpcUrl),
  });

  return { walletClient, account };
}

/**
 * Create a public client for Sepolia network
 * @param {string} rpcUrl - Optional custom RPC URL (defaults to Alchemy Sepolia)
 * @returns {Object} The public client
 */
function createSepoliaPublicClient(rpcUrl = null) {
  const defaultRpcUrl = 'https://eth-sepolia.g.alchemy.com/v2/1mD9crsR21kE_lM0gFgLbzQ0JBY0CcyI';
  const finalRpcUrl = rpcUrl || process.env.RPC_URL || defaultRpcUrl;
  
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(finalRpcUrl),
  });

  return publicClient;
}

/**
 * Get the current and pending nonce for an account
 * @param {Object} publicClient - The public client instance
 * @param {string} address - The account address
 * @returns {Object} Object containing current and pending nonce
 */
async function getNonceInfo(publicClient, address) {
  const currentNonce = await publicClient.getTransactionCount({ address });
  const pendingNonce = await publicClient.getTransactionCount({ 
    address, 
    blockTag: 'pending' 
  });
  
  return { currentNonce, pendingNonce };
}

module.exports = {
  createSepoliaWalletClient,
  createSepoliaPublicClient,
  getNonceInfo,
};



