const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)
const COLLATERAL_POOL_ID = ''
const PRICE_FEED = ''
const COLLATERAL_POOL_CONFIG_ADDRESS =addressesConfig.COLLATERAL_POOL_CONFIG_ADDRESS
const _encodeSetPriceFeed = (_collateralPoolId, _priceFeed) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setPriceFeed',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_collateralPoolId'
        },{
            type: 'address',
            name: '_priceFeed'
        }]
    }, [_collateralPoolId,_priceFeed]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeSetPriceFeed(COLLATERAL_POOL_ID,PRICE_FEED),
        COLLATERAL_POOL_CONFIG_ADDRESS,
        "setPriceFeed"
    )
}