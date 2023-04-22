const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const COLLATERAL_POOL_ID = ''
const SHOW_STOPPER_ADDRESS =addressesConfig.SHOW_STOPPER_ADDRESS

const _encodeCagePool = (_collateralPoolId) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'cagePool',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_collateralPoolId'
        }]
    }, [_collateralPoolId]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeCagePool(COLLATERAL_POOL_ID),
        SHOW_STOPPER_ADDRESS,
        "cageCollateralPool"
    )
}