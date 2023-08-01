const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const BOOK_KEEPER_ADDRESS =addressesConfig.BOOK_KEEPER_ADDRESS
const TOTAL_DEBT_CEILING = web3.utils.toWei("1000000000000000000000000000","wei")
const _encodeSetTotalDebtCeiling = (totalDebtCeiling) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setTotalDebtCeiling',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: '_totalDebtCeiling'
        }]
    }, [totalDebtCeiling]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetTotalDebtCeiling(TOTAL_DEBT_CEILING),
        BOOK_KEEPER_ADDRESS,
        "setTotalDebtCeiling"
    )
}
