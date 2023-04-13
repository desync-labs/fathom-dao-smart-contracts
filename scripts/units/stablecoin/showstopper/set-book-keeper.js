const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const addressesConfig = require('../../../../config/config.js')

const BOOK_KEEPER_ADDRESS = ""
const SHOW_STOPPER_ADDRESS =addressesConfig.SHOW_STOPPER_ADDRESS

const _encodeSetBookKeeper = (_bookkeeper) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setBookKeeper',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_bookkeeper'
        }]
    }, [_bookkeeper]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetBookKeeper(BOOK_KEEPER_ADDRESS),
        SHOW_STOPPER_ADDRESS,
        "setBookKeeper"
    )
}