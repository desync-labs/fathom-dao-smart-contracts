const fs = require('fs');
const txnHelper = require('../helpers/submitAndExecuteTransaction')

const constants = require('../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_DEX_FOLDER)
const FEE_TO_SETTER = ""
const STAKING_ADDRESS = addressesConfig.STAKING_ADDRESS
const MIN_LOCK_PERIOD = 86400/2

const _encodeSetMinLockPeriod = (_minLockPeriod) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setMinimumLockPeriod',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: '_minLockPeriod'
        }]
    }, [_minLockPeriod]);

    return toRet;
}


module.exports = async function(deployer) {
    
    await txnHelper.submitAndExecute(
        _encodeSetMinLockPeriod(MIN_LOCK_PERIOD),
        STAKING_ADDRESS,
        "set min lock period"
    )
}