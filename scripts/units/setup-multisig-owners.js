//NOTE: Do this at the very end as other scripts wont execute after this is done due to owners signatures requirement
const fs = require('fs');
const constants = require('./helpers/constants')
const txnHelper = require('./helpers/submitAndExecuteTransaction')

const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);

const COUNCIL_1_PLACEHOLDER = "0xc0Ee98ac1a44B56fbe2669A3B3C006DEB6fDd0f9";
const COUNCIL_2_PLACEHOLDER = "0x01d2D3da7a42F64e7Dc6Ae405F169836556adC86";

const _encodeAddOwnersFunction = (_accounts) => {
    

    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'addOwners',
        type: 'function',
        inputs: [{
            type: 'address[]',
            name: '_owners'
        }]
    }, [_accounts]);

    return toRet;
}

module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeAddOwnersFunction([COUNCIL_1_PLACEHOLDER, COUNCIL_2_PLACEHOLDER]),
        addresses.multiSigWallet,
        "setupMultisigOwner"
    )

}