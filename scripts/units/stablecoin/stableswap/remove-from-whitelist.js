const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const whitelistAddress = "0x2B3691065A78F5fb02E9BF54A197b95da2B26AF7"
const STABLE_SWAP_ADDRESS =addressesConfig.STABLE_SWAP_ADDRESS

const _encodeRemoveFromWhitelist = (_whitelistAddress) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'addToWhitelist',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_user'
        }]
    }, [_whitelistAddress]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeRemoveFromWhitelist(whitelistAddress),
        STABLE_SWAP_ADDRESS,
        "Remove-from-whitelist-Stableswap"
    )
}