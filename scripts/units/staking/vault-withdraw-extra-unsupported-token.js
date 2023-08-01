const fs = require('fs');
const txnHelper = require('../helpers/submitAndExecuteTransaction')

const constants = require('../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_DEX_FOLDER)
const FEE_TO_SETTER = ""
const VAULT_ADDRESS = addressesConfig.VAULT_ADDRESS
const WITHDRAW_TO = ""
const TOKEN = ""
const _encodeWithdrawExtraSupportedToken = (token, withdrawTo) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'withdrawExtraUnsupportedToken',
        type: 'function',
        inputs: [
            {
                type: 'address',
                name: '_token'
            },
            {
            type: 'address',
            name: '_withdrawTo'
        }]
    }, [token, withdrawTo]);

    return toRet;
}


module.exports = async function(deployer) {
    
    await txnHelper.submitAndExecute(
        _encodeWithdrawExtraSupportedToken(TOKEN, WITHDRAW_TO),
        VAULT_ADDRESS,
        "withdraw-extra-unsupported-token"
    )
}