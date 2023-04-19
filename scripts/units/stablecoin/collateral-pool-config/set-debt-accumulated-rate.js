const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const env = process.env.NODE_ENV || 'dev';
const addressesConfig = require(`../../../../config/config.${env}`)
const COLLATERAL_POOL_ID = ''
const DEBT_ACCUMULATED_RATE = ''
const COLLATERAL_POOL_CONFIG_ADDRESS =addressesConfig.COLLATERAL_POOL_CONFIG_ADDRESS
const _encodeLiquidatorIncentiveBPS = (_collateralPoolId, _debtAccumulatedRate) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setDebtAccumulatedRate',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_collateralPoolId'
        },{
            type: 'uint256',
            name: '_debtAccumulatedRate'
        }]
    }, [_collateralPoolId,_debtAccumulatedRate]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeLiquidatorIncentiveBPS(COLLATERAL_POOL_ID,DEBT_ACCUMULATED_RATE),
        COLLATERAL_POOL_CONFIG_ADDRESS,
        "setDebtAccumulatedRate"
    )
}