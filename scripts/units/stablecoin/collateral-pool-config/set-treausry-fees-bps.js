const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)
const COLLATERAL_POOL_ID = ''
const TREASURY_FEES_BPS = ''
const COLLATERAL_POOL_CONFIG_ADDRESS =addressesConfig.COLLATERAL_POOL_CONFIG_ADDRESS
const _encodeLiquidatorIncentiveBPS = (_collateralPoolId, _treasuryFeesBps) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setTreasuryFeesBps',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_collateralPoolId'
        },{
            type: 'uint256',
            name: '_treasuryFeesBps'
        }]
    }, [_collateralPoolId,_treasuryFeesBps]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeLiquidatorIncentiveBPS(COLLATERAL_POOL_ID,TREASURY_FEES_BPS),
        COLLATERAL_POOL_CONFIG_ADDRESS,
        "setTreasuryFeesBps"
    )
}