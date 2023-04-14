const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const addressesConfig = require('../../../../config/config')
const COLLATERAL_POOL_ID = ''
const LIQUIDATOR_INCENTIVE_BPS = ''
const COLLATERAL_POOL_CONFIG_ADDRESS =addressesConfig.COLLATERAL_POOL_CONFIG_ADDRESS
const _encodeLiquidatorIncentiveBPS = (_collateralPoolId, _liquidatorIncentiveBps) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setLiquidatorIncentiveBps',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_collateralPoolId'
        },{
            type: 'uint256',
            name: '_liquidatorIncentiveBps'
        }]
    }, [_collateralPoolId,_liquidatorIncentiveBps]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeLiquidatorIncentiveBPS(COLLATERAL_POOL_ID,LIQUIDATOR_INCENTIVE_BPS),
        COLLATERAL_POOL_CONFIG_ADDRESS,
        "setLiquidatorIncentiveBps"
    )
}