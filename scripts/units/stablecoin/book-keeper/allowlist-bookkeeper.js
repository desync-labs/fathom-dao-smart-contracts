const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const BOOK_KEEPER_ADDRESS =addressesConfig.BOOK_KEEPER_ADDRESS
const TO_BE_ALLOWLISTED = "0x2B3691065A78F5fb02E9BF54A197b95da2B26AF7"
const _encodeAllowlist = (toBeAllowlistedAddress) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'allowlist',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'toBeAllowlistedAddress'
        }]
    }, [toBeAllowlistedAddress]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeAllowlist(TO_BE_ALLOWLISTED),
        BOOK_KEEPER_ADDRESS,
        "setAllowlistedAddressBookkeeper"
    )
}