const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const SYSTEM_DEBT_ENGINE_ADDRESS =addressesConfig.SYSTEM_DEBT_ENGINE_ADDRSESS
const COLLATERAL_POOL_ID = ''
const ADAPTER = ''
const TO = ''
const AMOUNT = web3.utils.toWei('1','ether');
//TODO ssubik
//TODO ssubik: Withdraw - CollateralTokenAdapter
const _encodeWithdrawCollateralSurplus = (_collateralPoolId,_adapter,_to,_amount) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'withdrawCollateralSurplus',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_collateralPoolId'
        },{
            type: 'address',
            name: '_adapter'
        },{
            type: 'address',
            name: '_to'
        },{
            type: 'uint256',
            name: '_amount'
        }]
    }, [_collateralPoolId,_adapter,_to,_amount]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeWithdrawCollateralSurplus(COLLATERAL_POOL_ID,ADAPTER,TO,AMOUNT),
        SYSTEM_DEBT_ENGINE_ADDRESS,
        "withdrawCollateralPlus"
    )
}