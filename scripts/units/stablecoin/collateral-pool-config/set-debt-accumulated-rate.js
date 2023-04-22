const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)
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