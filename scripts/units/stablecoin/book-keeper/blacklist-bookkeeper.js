const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);

const BOOK_KEEPER_ADDRESS =addressesExternal.BOOK_KEEPER_ADDRESS
const TO_BE_BLACKLISTED = "0x"
const _encodeBlacklist = (toBeBlacklistedAddress) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'blacklist',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'toBeBlacklistedAddress'
        }]
    }, [toBeBlacklistedAddress]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeBlacklist(TO_BE_BLACKLISTED),
        BOOK_KEEPER_ADDRESS,
        "setBlacklistedAddressBookkeeper"
    )
}