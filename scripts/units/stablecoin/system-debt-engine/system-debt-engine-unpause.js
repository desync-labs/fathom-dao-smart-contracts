const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const env = process.env.NODE_ENV || 'dev';
const addressesConfig = require(`../../../../config/config.${env}`)

const SYSTEM_DEBT_ENGINE_ADDRESS =addressesConfig.SYSTEM_DEBT_ENGINE_ADDRESS

const _encodeUnause = () => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'unpause',
        type: 'function',
        inputs: []
    }, []);
    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeUnause(),
        SYSTEM_DEBT_ENGINE_ADDRESS,
        "unpauseSystemDebtEngine"
    )
}