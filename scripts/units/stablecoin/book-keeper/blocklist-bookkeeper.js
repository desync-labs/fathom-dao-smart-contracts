const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);

const BOOK_KEEPER_ADDRESS =addressesExternal.BOOK_KEEPER_ADDRESS
const TO_BE_BLOCKLISTED = "0x"
const _encodeBlocklist = (toBeBlocklistedAddress) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'blocklist',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'toBeBlocklistedAddress'
        }]
    }, [toBeBlocklistedAddress]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeBlocklist(TO_BE_BLOCKLISTED),
        BOOK_KEEPER_ADDRESS,
        "setBlocklistedAddressBookkeeper"
    )
}