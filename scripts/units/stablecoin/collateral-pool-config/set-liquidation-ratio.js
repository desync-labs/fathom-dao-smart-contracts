const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);
const COLLATERAL_POOL_ID = ''
const DATA = ''
const COLLATERAL_POOL_CONFIG_ADDRESS =addressesExternal.COLLATERAL_POOL_CONFIG_ADDRESS
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