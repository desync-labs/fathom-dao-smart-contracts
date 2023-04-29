const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const SECOND = 1
const DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS =addressesConfig.DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS

const _encodeSetPriceLife = (_second) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setPriceLife',
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
        _encodeSetPriceLife(SECOND),
        DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS,
        "setPriceLife"
    )
}