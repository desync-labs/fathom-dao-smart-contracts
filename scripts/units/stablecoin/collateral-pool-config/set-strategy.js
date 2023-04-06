const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const addressesConfig = require('../../../../config/config.js')
const STRATEGY = ''
const COLLATERAL_POOL_CONFIG_ADDRESS =addressesConfig.COLLATERAL_POOL_CONFIG_ADDRESS
const _encodeSetStrategy = (_collateralPoolId, _strategy) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setStrategy',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_collateralPoolId'
        },{
            type: 'address',
            name: '_strategy'
        }]
    }, [_collateralPoolId,_strategy]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeSetStrategy(COLLATERAL_POOL_ID,STRATEGY),
        COLLATERAL_POOL_CONFIG_ADDRESS,
        "setStrategy"
    )
}