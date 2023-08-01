const fs = require('fs');
const txnHelper = require('../helpers/submitAndExecuteTransaction')

const constants = require('../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_DEX_FOLDER)
const FEE_TO_SETTER = ""
const VAULT_ADDRESS = addressesConfig.VAULT_ADDRESS
const TOKEN_ADDRESS = ""

const _encodeRemoveSupportedToken = (_token) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'removeSupportedToken',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_token'
        }]
    }, [_token]);

    return toRet;
}


module.exports = async function(deployer) {
    
    await txnHelper.submitAndExecute(
        _encodeRemoveSupportedToken(TOKEN_ADDRESS),
        VAULT_ADDRESS,
        "remove-supported-token"
    )
}