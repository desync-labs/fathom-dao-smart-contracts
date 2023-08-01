const fs = require('fs');
const txnHelper = require('../helpers/submitAndExecuteTransaction')

const constants = require('../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_DEX_FOLDER)
const FEE_TO_SETTER = ""
const STAKING_ADDRESS = addressesConfig.STAKING_ADDRESS
const VAULT = ""

const _encodeUpdateVault = (_vault) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'updateVault',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_vault'
        }]
    }, [_vault]);

    return toRet;
}


module.exports = async function(deployer) {
    
    await txnHelper.submitAndExecute(
        _encodeUpdateVault(VAULT),
        STAKING_ADDRESS,
        "update vault address"
    )
}