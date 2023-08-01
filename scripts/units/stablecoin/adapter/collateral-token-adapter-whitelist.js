const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)
const COLLATERAL_TOKEN_ADAPTER_ADDRESS =addressesConfig.COLLATERAL_TOKEN_ADAPTER_ADDRESS
const toBeWhitelisted = ""
const _encodeAddToWhitelist = (toBeWhitelisted) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'whitelist',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'toBeWhitelisted'
        }]
    }, [toBeWhitelisted]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeAddToWhitelist(toBeWhitelisted),
        COLLATERAL_TOKEN_ADAPTER_ADDRESS,
        "WhitelistCollateralTokenAdapter"
    )
}
