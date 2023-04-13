const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const addressesConfig = require('../../../../config/config.js')

const ACCESS_CONTROL_CONFIG = ""
const DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS =addressesConfig.DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS

const _encodeSetAccessControlConfig = (_accessControlConfig) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setAccessControlConfig',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_accessControlConfig'
        }]
    }, [_accessControlConfig]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetAccessControlConfig(ACCESS_CONTROL_CONFIG),
        DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS,
        "setAccessControlConfig"
    )
}