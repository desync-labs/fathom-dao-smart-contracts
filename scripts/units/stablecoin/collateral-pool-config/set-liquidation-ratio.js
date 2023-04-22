const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)
const COLLATERAL_POOL_ID = ''
const DATA = ''
const COLLATERAL_POOL_CONFIG_ADDRESS =addressesConfig.COLLATERAL_POOL_CONFIG_ADDRESS
const _encodeSetLiquidationRatio = (_collateralPoolId, _data) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setLiquidationRatio',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_poolId'
        },{
            type: 'uint256',
            name: '_data'
        }]
    }, [_collateralPoolId,_data]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeSetDebtFloor(COLLATERAL_POOL_ID,DATA),
        COLLATERAL_POOL_CONFIG_ADDRESS,
        "setLiquidationRatio"
    )
}