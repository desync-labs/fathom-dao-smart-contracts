//NOTE: Do this at the very end as other scripts wont execute after this is done due to owners signatures requirement
const fs = require('fs');
const constants = require('./helpers/constants')
const txnHelper = require('./helpers/submitAndExecuteTransaction')
const env = process.env.NODE_ENV || 'dev';
const addressesConfig = require(`../../config/config.${env}`)

const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);

const COUNCIL_2_PLACEHOLDER = addressesConfig.COUNCIL_2;
const COUNCIL_3_PLACEHOLDER = addressesConfig.COUNCIL_2;

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
        _encodeAddOwnersFunction([COUNCIL_2_PLACEHOLDER, COUNCIL_3_PLACEHOLDER]),
        addresses.multiSigWallet,
        "setupMultisigOwner"
    )

}