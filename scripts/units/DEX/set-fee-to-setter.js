const fs = require('fs');
const txnHelper = require('../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);

const DEX_FACTORY_ADDRESS =addressesExternal.DEX_FACTORY_ADDRESS
const FEE_TO_SETTER = ""
const _encodeSetFeeToSetter = (_feeToSetter) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setFeeToSetter',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_feeToSetter'
        }]
    }, [_feeToSetter]);

    return toRet;
}


module.exports = async function(deployer) {
    
    await txnHelper.submitAndExecute(
        _encodeSetFeeToSetter(FEE_TO),
        FEE_TO_SETTER,
        "setFeeToSetterDEX"
    )
}