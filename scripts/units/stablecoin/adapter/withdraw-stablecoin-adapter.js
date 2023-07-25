const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)
const BOOK_KEEPER_ADDRESS =addressesConfig.BOOK_KEEPER_ADDRESS
const STABLE_COIN_ADAPTER_ADDRESS =addressesConfig.STABLE_COIN_ADAPTER_ADDRESS
const wad = web3.utils.toWei("100000","wei")
const usr = ""
const _encodeWithdraw = (usr, wad) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'withdraw',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'usr'
        }, {
            type: 'uint256',
            name: 'wad'
        },{
            type: 'bytes'
        }]
    }, [usr,wad]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeWithdraw(usr,wad),
        STABLE_COIN_ADAPTER_ADDRESS,
        "WithdrawStablecoinAdapter"
    )
}
