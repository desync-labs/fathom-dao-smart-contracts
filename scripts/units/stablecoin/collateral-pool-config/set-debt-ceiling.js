const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)
const COLLATERAL_POOL_ID = '0x5844430000000000000000000000000000000000000000000000000000000000'
const DEBT_CEILING = web3.utils.toWei('3999999999999999986441897348723255952923416883888128','wei')
const COLLATERAL_POOL_CONFIG_ADDRESS =addressesConfig.COLLATERAL_POOL_CONFIG_ADDRESS
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