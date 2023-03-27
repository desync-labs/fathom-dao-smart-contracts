const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);
const COLLATERAL_POOL_ID = ''
const PRICE_FEED = ''
const COLLATERAL_POOL_CONFIG_ADDRESS =addressesExternal.COLLATERAL_POOL_CONFIG_ADDRESS
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