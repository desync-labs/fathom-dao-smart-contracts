const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const env = process.env.NODE_ENV || 'dev';
const addressesConfig = require(`../../../../config/config.${env}`)
const DATA = 1
const SYSTEM_DEBT_ENGINE_ADDRESS = addressesConfig.SYSTEM_DEBT_ENGINE_ADDRESS

const _encodeSetSurplusBuffer = (_data) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setSurplusBuffer',
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
        _encodeSetSurplusBuffer(DATA),
        SYSTEM_DEBT_ENGINE_ADDRESS,
        "setSurplusBuffer"
    )
}