const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const addressesConfig = require('../../../../config/config.js')

const DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS =addressesConfig.DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS

const _encodeSetPrice = () => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setPrice',
        type: 'function',
        inputs: []
    }, []);
    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetPrice(),
        DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS,
        "setPriceDelayFathomOracle"
    )
}