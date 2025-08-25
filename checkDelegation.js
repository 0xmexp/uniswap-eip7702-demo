require('dotenv').config();
const { Delegation } = require('@uniswap/smart-wallet-sdk');
const { createSepoliaPublicClient } = require('./utils/walletClient');

async function checkDelegation() {
  const address = process.env.CHECK_ADDRESS || process.env.ADDRESS || process.env.PUBLIC_KEY;
  if (!address) throw new Error('Set CHECK_ADDRESS or ADDRESS or PUBLIC_KEY in .env');

  const client = createSepoliaPublicClient();

  const code = await client.getBytecode({ address });
  console.log('EOA code:', code);

  // TODO
  // try {
  //   const delegatedTo = Delegation.parseFromCode(code);
  //   console.log('Delegated to contract:', delegatedTo);
  // } catch (e) {
  //   console.log('Not delegated or invalid delegation code.');
  // }
}

checkDelegation().catch(console.error);
