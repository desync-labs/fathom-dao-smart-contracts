const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);
const FEE_IN = 1
const STABLE_SWAP_ADDRESS = addressesExternal.STABLE_SWAP_ADDRESS

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