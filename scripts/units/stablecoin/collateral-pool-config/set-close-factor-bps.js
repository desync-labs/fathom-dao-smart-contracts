const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);
const COLLATERAL_POOL_ID = ''
const CLOSE_FACTOR_BPS = ''
const COLLATERAL_POOL_CONFIG_ADDRESS =addressesExternal.COLLATERAL_POOL_CONFIG_ADDRESS
const _encodeCloseFactorBPS = (_collateralPoolId, _closeFactorBps) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setCloseFactorBps',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_collateralPool'
        },{
            type: 'uint256',
            name: '_closeFactorBps'
        }]
    }, [_collateralPoolId,_closeFactorBps]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeCloseFactorBPS(COLLATERAL_POOL_ID,CLOSE_FACTOR_BPS),
        COLLATERAL_POOL_CONFIG_ADDRESS,
        "setCloseFactorBps"
    )
}