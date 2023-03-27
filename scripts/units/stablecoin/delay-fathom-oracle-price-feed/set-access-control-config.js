const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);

const ACCESS_CONTROL_CONFIG = ""
const DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS =addressesExternal.DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS

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