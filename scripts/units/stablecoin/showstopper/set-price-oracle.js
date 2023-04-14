const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const addressesConfig = require('../../../../config/config')

const PRICE_ORACLE = ""
const SHOW_STOPPER_ADDRESS =addressesConfig.SHOW_STOPPER_ADDRESS

const _encodeSetPriceOracle = (_priceOracle) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setPriceOracle',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_priceOracle'
        }]
    }, [_priceOracle]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetPriceOracle(PRICE_ORACLE),
        SHOW_STOPPER_ADDRESS,
        "setPriceOracle"
    )
}