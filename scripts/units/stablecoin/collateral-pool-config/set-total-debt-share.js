const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const env = process.env.NODE_ENV || 'dev';
const addressesConfig = require(`../../../../config/config.${env}`)
const COLLATERAL_POOL_ID = ''
const TOTAL_DEBT_SHARE = ''
const COLLATERAL_POOL_CONFIG_ADDRESS =addressesConfig.COLLATERAL_POOL_CONFIG_ADDRESS
const _encodeTotalDebtShare = (_collateralPoolId, _totalDebtShare) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setTotalDebtShare',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_collateralPoolId'
        },{
            type: 'uint256',
            name: '_totalDebtShare'
        }]
    }, [_collateralPoolId,_totalDebtShare]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeTotalDebtShare(COLLATERAL_POOL_ID,TOTAL_DEBT_SHARE),
        COLLATERAL_POOL_CONFIG_ADDRESS,
        "setTotalDebtShare"
    )
}