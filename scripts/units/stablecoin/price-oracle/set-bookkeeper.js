const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const PRICE_ORACLE_ADDRESS =addressesConfig.PRICE_ORACLE_ADDRESS
const BOOKKEEPER = ''
const _encodeSetPrice = (_bookkeeper) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setBookKeeper',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_bookKeeper'
        }]
    }, [_bookkeeper]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetPrice(BOOKKEEPER),
        PRICE_ORACLE_ADDRESS,
        "set-bookkeeper-PriceOracle"
    )
}