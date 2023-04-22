const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)
const FEE_OUT = 1
const STABLE_SWAP_ADDRESS = addressesConfig.STABLE_SWAP_ADDRESS

const _encodeSetFeeIn = (_feeOut) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setFeeOut',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: '_feeOut'
        }]
    }, [_feeOut]);

    return toRet;
}


module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeSetFeeIn(FEE_OUT),
        STABLE_SWAP_ADDRESS,
        "setStableSwapFeeOut"
    )
}