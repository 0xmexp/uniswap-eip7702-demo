/**
 * Transaction Debugger Utility
 * 
 * This utility provides functions to prepare and display raw transaction details
 * @param {Object} transactionRequest - The original transaction request
 * @param {Object} authorization - The EIP-7702 authorization object
 * @returns {Object} Safe transaction request for JSON serialization
 */
function createTransactionRequest(transactionRequest, authorization) {
  return {
    authorizationList: [{
      address: authorization.address,
      chainId: authorization.chainId,
      nonce: authorization.nonce,
      r: authorization.r,
      s: authorization.s,
      v: authorization.v.toString(),
      yParity: authorization.yParity
    }],
    to: transactionRequest.to,
    data: transactionRequest.data,
    value: transactionRequest.value.toString(),
  };
}

/**
 * Displays comprehensive transaction details in a formatted way
 * 
 * @param {Object} transactionRequest - The transaction request object
 * @param {Object} authorization - The EIP-7702 authorization object
 */
function displayTransactionDetails(transactionRequest, authorization) {
  console.log('\n=== RAW TRANSACTION DETAILS ===');
  
  const safeTransactionRequest = createTransactionRequest(transactionRequest, authorization);
  
  console.log('Transaction Request:', JSON.stringify(safeTransactionRequest, null, 2));
  console.log('\nTransaction Components:');
  console.log('- Type: EIP-7702 (Type-4)');
  console.log('- To:', transactionRequest.to);
  console.log('- Data Length:', transactionRequest.data.length, 'characters');
  console.log('- Data (first 100 chars):', transactionRequest.data.substring(0, 100) + '...');
  console.log('- Value:', transactionRequest.value.toString(), 'wei');
  console.log('- Authorization Count:', transactionRequest.authorizationList.length);
  
  console.log('- Authorization Details:', {
    address: transactionRequest.authorizationList[0].address,
    chainId: transactionRequest.authorizationList[0].chainId,
    nonce: transactionRequest.authorizationList[0].nonce,
    r: transactionRequest.authorizationList[0].r,
    s: transactionRequest.authorizationList[0].s,
    v: transactionRequest.authorizationList[0].v.toString(),
    yParity: transactionRequest.authorizationList[0].yParity
  });
}

/**
 * Displays execution call details
 * 
 * @param {Object} executionCall - The execution call object from SmartWallet.createExecute
 */
function displayExecutionCallDetails(executionCall) {
  console.log('\n=== EXECUTION CALL DETAILS ===');
  console.log('Target Address:', executionCall.to);
  console.log('Data Length:', executionCall.data.length, 'characters');
  console.log('Value:', executionCall.value.toString(), 'wei');
  console.log('Data Preview:', executionCall.data.substring(0, 100) + '...');
}

/**
 * Displays method parameters
 * 
 * @param {Object} methodParameters - The method parameters from SmartWallet.encodeBatchedCall
 */
function displayMethodParameters(methodParameters) {
  console.log('\n=== METHOD PARAMETERS ===');
  console.log('Calldata Length:', methodParameters.calldata.length, 'characters');
  console.log('Value:', methodParameters.value.toString(), 'wei');
  console.log('Calldata Preview:', methodParameters.calldata.substring(0, 100) + '...');
}

module.exports = {
  createTransactionRequest,
  displayTransactionDetails,
  displayExecutionCallDetails,
  displayMethodParameters,
};

