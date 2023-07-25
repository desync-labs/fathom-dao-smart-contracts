const fs = require('fs');
const txnHelper = require('../helpers/submitAndExecuteTransaction')

const constants = require('../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_DEX_FOLDER)
const FEE_TO_SETTER = ""
const STAKING_ADDRESS = addressesConfig.STAKING_ADDRESS
const VAULT = ""
const TREASURY_ADDRESS = ""

const _encodeSetTreausuryAddress = (newTreasury) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setTreasuryAddress',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'newTreasury'
        }]
    }, [newTreasury]);

    return toRet;
}


module.exports = async function(deployer) {
    
    await txnHelper.submitAndExecute(
        _encodeSetTreausuryAddress(TREASURY_ADDRESS),
        STAKING_ADDRESS,
        "set treasury address"
    )
}