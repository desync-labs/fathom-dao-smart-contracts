const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const env = process.env.NODE_ENV || 'dev';
const addressesConfig = require(`../../../../config/config.${env}`)

const BOOK_KEEPER_ADDRESS =addressesConfig.BOOK_KEEPER_ADDRESS
const TO_BE_ALLOWLISTED = "0x"
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