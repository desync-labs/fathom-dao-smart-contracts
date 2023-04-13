const fs = require('fs');
const txnHelper = require('../helpers/submitAndExecuteTransaction')
const addressesConfig = require('../../../config/config.js')

const DEX_FACTORY_ADDRESS =addressesConfig.DEX_FACTORY_ADDRESS
const TO_BE_WHITELISTED = "0x"
const FEE_TO = ""
const _encodeSetFeeTo = (_feeTo) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setFeeTo',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_feeTo'
        }]
    }, [_feeTo]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetFeeTo(FEE_TO),
        DEX_FACTORY_ADDRESS,
        "setFeeToDEX"
    )
}