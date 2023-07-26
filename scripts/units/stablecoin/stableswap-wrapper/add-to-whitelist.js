const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const whitelistAddress = "0xE82C380C6Ca0306C61454569e84e020d68B063EF"
const STABLE_SWAP_WRAPPER_ADDRESS =addressesConfig.STABLE_SWAP_WRAPPER_ADDRESS

const _encodeAddToWhitelist = (_whitelistAddress) => {
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
        _encodeAddToWhitelist(whitelistAddress),
        STABLE_SWAP_WRAPPER_ADDRESS,
        "Add-To-Whitelist-Stableswap-wrapper"
    )
}