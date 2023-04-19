const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const env = process.env.NODE_ENV || 'dev';
const addressesConfig = require(`../../../../config/config.${env}`)
const COLLATERAL_POOL_ID = ''
const ADAPTER = ''
const COLLATERAL_POOL_CONFIG_ADDRESS =addressesConfig.COLLATERAL_POOL_CONFIG_ADDRESS
const _encodeSetAdapter = (_collateralPoolId, _adapter) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setAdapter',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_collateralPoolId'
        },{
            type: 'address',
            name: '_adapter'
        }]
    }, [_collateralPoolId,_adapter]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeSetAdapter(COLLATERAL_POOL_ID,ADAPTER),
        COLLATERAL_POOL_CONFIG_ADDRESS,
        "setAdapter"
    )
}