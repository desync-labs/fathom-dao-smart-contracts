const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const PROXY_WALLET_REGISTRY_ADDRESS =addressesConfig.PROXY_WALLET_REGISTRY_ADDRESS
const WHITELIST_ADDRESS = ""
const _encodeAddToWhitelist = (_usr) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'addToWhitelist',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_usr'
        }]
    }, [_usr]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeAddToWhitelist(WHITELIST_ADDRESS),
        PROXY_WALLET_REGISTRY_ADDRESS,
        "set whitelist-proxy-wallet-registry"
    )
}