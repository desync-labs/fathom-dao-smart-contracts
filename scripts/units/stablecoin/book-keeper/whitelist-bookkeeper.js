const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);

const BOOK_KEEPER_ADDRESS =addressesExternal.BOOK_KEEPER_ADDRESS
const TO_BE_WHITELISTED = "0x"
const _encodeWhitelist = (toBeWhitelistedAddress) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'whitelist',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'toBeWhitelistedAddress'
        }]
    }, [toBeWhitelistedAddress]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeWhitelist(TO_BE_WHITELISTED),
        BOOK_KEEPER_ADDRESS,
        "setWhitelistedAddressBookkeeper"
    )
}