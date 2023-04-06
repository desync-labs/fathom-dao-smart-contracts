const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const addressesConfig = require('../../../../config/config.js')

const SECOND = 1
const DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS =addressesConfig.DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS

const _encodeSetTimeDelay = (_second) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setTimeDelay',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: '_second'
        }]
    }, [_second]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetTimeDelay(SECOND),
        DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS,
        "setTimeDelay"
    )
}