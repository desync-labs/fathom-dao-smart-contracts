const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const addressesConfig = require('../../../../config/config')
const FEE_RATE =1
const FLASH_MINT_MODULE_ADDRESS = addressesConfig.FLASH_MINT_MODULE_ADDRESS

const _encodeSetFeeRate = (_data) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setFeeRate',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: '_data'
        }]
    }, [_data]);

    return toRet;
}


module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeSetFeeRate(_data),
        FLASH_MINT_MODULE_ADDRESS,
        "setFeeRate"
    )
}