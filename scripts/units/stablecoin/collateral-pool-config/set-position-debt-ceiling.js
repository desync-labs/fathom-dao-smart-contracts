const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)
const COLLATERAL_POOL_ID = addressesConfig.collateralPoolId
const positionDebtCeiling = web3.utils.toWei('','wei')// this needs to be set in terms of wei to avoid confusion of ray, rad and wei
const COLLATERAL_POOL_CONFIG_ADDRESS = addressesConfig.COLLATERAL_POOL_CONFIG_ADDRESS

const _encodeSetPositionDebtCeiling = (_collateralPoolId, _positionDebtCeiling) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setPositionDebtCeiling',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_collateralPoolId'
        },{
            type: 'uint256',
            name: '_positionDebtCeiling'
        }]
    }, [_collateralPoolId,_positionDebtCeiling]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeSetPositionDebtCeiling(COLLATERAL_POOL_ID,positionDebtCeiling),
        COLLATERAL_POOL_CONFIG_ADDRESS,
        "setPositionDebtCeiling"
    )
}