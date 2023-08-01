const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const POOL_ID = ''
const DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS =addressesConfig.DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS

const _encodeSetPoolId = (_poolId) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setPoolId',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_poolId'
        }]
    }, [_poolId]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetPoolId(POOL_ID),
        DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS,
        "setPoolId"
    )
}