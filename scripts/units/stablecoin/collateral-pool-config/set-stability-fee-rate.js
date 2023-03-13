const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);
const COLLATERAL_POOL_ID = ''
const STABILITY_FEE = ''
const COLLATERAL_POOL_CONFIG_ADDRESS =addressesExternal.COLLATERAL_POOL_CONFIG_ADDRESS
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