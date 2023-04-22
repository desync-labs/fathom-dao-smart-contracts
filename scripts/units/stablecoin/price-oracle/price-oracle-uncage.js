const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const PRICE_ORACLE_ADDRESS =addressesConfig.PRICE_ORACLE_ADDRESS

const _encodeUncage = () => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'cage',
        type: 'function',
        inputs: []
    }, []);
    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeUncage(),
        PRICE_ORACLE_ADDRESS,
        "uncagePriceOracle"
    )
}