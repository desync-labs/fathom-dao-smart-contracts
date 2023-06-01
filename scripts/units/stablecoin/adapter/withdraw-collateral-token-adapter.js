const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)
const COLLATERAL_TOKEN_ADAPTER_ADDRESS =addressesConfig.COLLATERAL_TOKEN_ADAPTER_ADDRESS
const _amount = web3.utils.toWei("100000","wei")
const _usr = ""
const _encodeWithdraw = (_usr, _amount) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'withdraw',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_usr'
        }, {
            type: 'uint256',
            name: '_amount'
        },{
            type: 'bytes'
        }]
    }, [_usr,_amount]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeWithdraw(_usr,_amount),
        COLLATERAL_TOKEN_ADAPTER_ADDRESS,
        "WithdrawCollateralTokenAdapter"
    )
}
