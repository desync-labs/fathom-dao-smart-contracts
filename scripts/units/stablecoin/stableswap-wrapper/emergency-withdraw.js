const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const ACCOUNT_DESTINATION = ""
const STABLE_SWAP_WRAPPER_ADDRESS =addressesConfig.STABLE_SWAP_WRAPPER_ADDRESS

const _encodeEmergencyWithdraw = (_destination) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'emergencyWithdraw',
        type: 'function',
        inputs: []
    }, []);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeEmergencyWithdraw(),
        STABLE_SWAP_WRAPPER_ADDRESS,
        "StableswapWrapperEmergencyWithdraw"
    )
}