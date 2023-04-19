const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const env = process.env.NODE_ENV || 'dev';
const addressesConfig = require(`../../../../config/config.${env}`)
const COLLATERAL_POOL_ID = ''
const STABILITY_FEE = ''
const COLLATERAL_POOL_CONFIG_ADDRESS =addressesConfig.COLLATERAL_POOL_CONFIG_ADDRESS
const _encodeStabilityFeeRate = (_collateralPoolId, _stabilityFeeRate) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setStabilityFeeRate',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_collateralPool'
        },{
            type: 'uint256',
            name: '_stabilityFeeRate'
        }]
    }, [_collateralPoolId,_stabilityFeeRate]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeStabilityFeeRate(COLLATERAL_POOL_ID,STABILITY_FEE),
        COLLATERAL_POOL_CONFIG_ADDRESS,
        "setStabilityFeeRate"
    )
}