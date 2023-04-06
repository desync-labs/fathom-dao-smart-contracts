const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const addressesConfig = require('../../../../config/config.js')

const PRICE_ORACLE_ADDRESS =addressesConfig.PRICE_ORACLE_ADDRESS
const COLLATERAL_POOL_ID = 123
const _encodeSetPrice = (_collateralPoolId) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setPrice',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_collateralPoolId'
        }]
    }, [_collateralPoolId]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetPrice(COLLATERAL_POOL_ID),
        PRICE_ORACLE_ADDRESS,
        "setPrice-PriceOracle"
    )
}