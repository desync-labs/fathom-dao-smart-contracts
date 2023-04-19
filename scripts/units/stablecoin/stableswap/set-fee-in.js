const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const env = process.env.NODE_ENV || 'dev';
const addressesConfig = require(`../../../../config/config.${env}`)
const FEE_IN = 1
const STABLE_SWAP_ADDRESS = addressesConfig.STABLE_SWAP_ADDRESS

const _encodeSetFeeIn = (_feeIn) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setFeeIn',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: '_feeIn'
        }]
    }, [_feeIn]);

    return toRet;
}


module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeSetFeeIn(FEE_IN),
        STABLE_SWAP_ADDRESS,
        "setStableSwapFeeIn"
    )
}