const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);
const COLLATERAL_POOL_ID = ''
const DEBT_CEILING = ''
const COLLATERAL_POOL_CONFIG_ADDRESS =addressesExternal.COLLATERAL_POOL_CONFIG_ADDRESS
const _encodeSetDebtCeiling = (_collateralPoolId, _debtCeiling) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setDebtCeiling',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_collateralPoolId'
        },{
            type: 'uint256',
            name: '_debtCeiling'
        }]
    }, [_collateralPoolId,_debtCeiling]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeSetDebtCeiling(COLLATERAL_POOL_ID,DEBT_CEILING),
        COLLATERAL_POOL_CONFIG_ADDRESS,
        "setDebtCeiling"
    )
}