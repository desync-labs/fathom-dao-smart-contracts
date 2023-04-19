const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const env = process.env.NODE_ENV || 'dev';
const addressesConfig = require(`../../../../config/config.${env}`)

const ACCOUNT_DESTINATION = ""
const STABLE_SWAP_ADDRESS =addressesConfig.STABLE_SWAP_ADDRESS

const _encodeEmergencyWithdraw = (_destination) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'emergencyWithdraw',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_account'
        }]
    }, [_destination]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeEmergencyWithdraw(ACCOUNT_DESTINATION),
        STABLE_SWAP_ADDRESS,
        "StableswapEmergencyWithdraw"
    )
}