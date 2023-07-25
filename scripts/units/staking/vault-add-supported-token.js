const fs = require('fs');
const txnHelper = require('../helpers/submitAndExecuteTransaction')

const constants = require('../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_DEX_FOLDER)
const FEE_TO_SETTER = ""
const STAKING_ADDRESS = addressesConfig.STAKING_ADDRESS
const TOKEN_ADDRESS = ""

const _encodeAddSupportedToken = (_token) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'addSupportedToken',
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
        _encodeAddSupportedToken(TOKEN_ADDRESS),
        STAKING_ADDRESS,
        "add-supported-token"
    )
}