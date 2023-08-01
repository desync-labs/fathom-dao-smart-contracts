const fs = require('fs');
const txnHelper = require('../helpers/submitAndExecuteTransaction')

const constants = require('../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_DEX_FOLDER)
const FEE_TO_SETTER = ""
const STAKING_ADDRESS = addressesConfig.STAKING_ADDRESS
const VAULT = ""
const MAX_LOCK_POSITIONS = 10

const _encodeSetMaxLockPositions = (newMaxLockPositions) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setMaxLockPositions',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: 'newMaxLockPositions'
        }]
    }, [newMaxLockPositions]);

    return toRet;
}


module.exports = async function(deployer) {
    
    await txnHelper.submitAndExecute(
        _encodeSetMaxLockPositions(MAX_LOCK_POSITIONS),
        STAKING_ADDRESS,
        "max lock positions"
    )
}