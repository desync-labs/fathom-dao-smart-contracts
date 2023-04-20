const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const env = process.env.NODE_ENV || 'dev';
const addressesConfig = require(`../../../../config/config.${env}`)

const whitelistAddress = "0x2B3691065A78F5fb02E9BF54A197b95da2B26AF7"
const STABLE_SWAP_ADDRESS =addressesConfig.STABLE_SWAP_ADDRESS

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
        STABLE_SWAP_ADDRESS,
        "Add-To-Whitelist-Stableswap"
    )
}