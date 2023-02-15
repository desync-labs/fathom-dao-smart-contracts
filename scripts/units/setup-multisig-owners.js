//NOTE: Do this at the very end as other scripts wont execute after this is done due to owners signatures requirement
const fs = require('fs');

const eventsHelper = require("../tests/helpers/eventsHelper");

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");

const EMPTY_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000';
const SUBMIT_TRANSACTION_EVENT = "SubmitTransaction(uint256,address,address,uint256,bytes)";

const COUNCIL_1_PLACEHOLDER = "0xc0Ee98ac1a44B56fbe2669A3B3C006DEB6fDd0f9";
const COUNCIL_2_PLACEHOLDER = "0x01d2D3da7a42F64e7Dc6Ae405F169836556adC86";
const rawdata = fs.readFileSync('../../addresses.json');
const addresses = JSON.parse(rawdata);

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
    const MULTISIG_WALLET_ADDRESS = addresses.multiSigWallet;
    const multiSigWallet = await IMultiSigWallet.at(MULTISIG_WALLET_ADDRESS);

    let result = await multiSigWallet.submitTransaction(
        MULTISIG_WALLET_ADDRESS, 
        EMPTY_BYTES,
        _encodeAddOwnersFunction([COUNCIL_1_PLACEHOLDER, COUNCIL_2_PLACEHOLDER]),
        0,
        {gas: 8000000}
    );

    txIndex = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];

    await multiSigWallet.confirmTransaction(txIndex, {gas: 8000000});
    await multiSigWallet.executeTransaction(txIndex, {gas: 8000000});
}