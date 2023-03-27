const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);

const BOOK_KEEPER_ADDRESS =addressesExternal.BOOK_KEEPER_ADDRESS
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