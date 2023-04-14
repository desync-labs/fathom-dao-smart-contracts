const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const addressesConfig = require('../../../../config/config')
const COLLATERAL_POOL_ID = ''
const DEBT_FLOOR = ''
const COLLATERAL_POOL_CONFIG_ADDRESS =addressesConfig.COLLATERAL_POOL_CONFIG_ADDRESS
const _encodeSetDebtFloor = (_collateralPoolId, _debtFloor) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setDebtFloor',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_collateralPoolId'
        },{
            type: 'uint256',
            name: '_debtFloor'
        }]
    }, [_collateralPoolId,_debtFloor]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeSetDebtFloor(COLLATERAL_POOL_ID,DEBT_FLOOR),
        COLLATERAL_POOL_CONFIG_ADDRESS,
        "setDebtFloor"
    )
}