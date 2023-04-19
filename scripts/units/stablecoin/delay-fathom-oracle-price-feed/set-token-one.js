const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const env = process.env.NODE_ENV || 'dev';
const addressesConfig = require(`../../../../config/config.${env}`)

const TOKEN_ONE = ""
const DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS =addressesConfig.DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS

const _encodeSetToken1 = (_token) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setToken1',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_token'
        }]
    }, [_token]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetToken1(TOKEN_ONE),
        DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS,
        "setToken1"
    )
}