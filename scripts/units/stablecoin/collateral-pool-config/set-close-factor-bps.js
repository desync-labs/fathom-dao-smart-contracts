const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const env = process.env.NODE_ENV || 'dev';
const addressesConfig = require(`../../../../config/config.${env}`)
const COLLATERAL_POOL_ID = ''
const CLOSE_FACTOR_BPS = ''
const COLLATERAL_POOL_CONFIG_ADDRESS =addressesConfig.COLLATERAL_POOL_CONFIG_ADDRESS
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