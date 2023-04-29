const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)
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