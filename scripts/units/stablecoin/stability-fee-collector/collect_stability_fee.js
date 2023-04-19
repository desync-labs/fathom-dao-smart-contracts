const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const env = process.env.NODE_ENV || 'dev';
const addressesConfig = require(`../../../../config/config.${env}`)

const STABILITY_FEE_COLLECTOR_ADDRESS =addressesConfig.STABILITY_FEE_COLLECTOR_ADDRESS

const _encodeCollect = (_collateralPool) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'collect',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_collateralPool'
        }]
    }, [_collateralPool]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeCollect(_collateralPool),
        STABILITY_FEE_COLLECTOR_ADDRESS,
        "CollectStabilityFee"
    )
}