const eventsHelper = require("../../tests/helpers/eventsHelper");
const constants = require("../../tests/helpers/testConstants");
const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");

const EMPTY_BYTES = constants.EMPTY_BYTES;
const SUBMIT_TRANSACTION_EVENT = constants.SUBMIT_TRANSACTION_EVENT

const COUNCIL_1 = constants.COUNCIL_1

const NEW_MULTISIG_REQUIREMENT = 2;

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
    const multiSigWallet = await IMultiSigWallet.at(MultiSigWallet.address);

    let result = await multiSigWallet.submitTransaction(
        multiSigWallet.address, 
        EMPTY_BYTES,
        _encodeAddOwnersFunction([COUNCIL_1]),
        0,
        {gas: 8000000}
    );

    txIndex = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];

    await multiSigWallet.confirmTransaction(txIndex, {gas: 8000000});
    await multiSigWallet.executeTransaction(txIndex, {gas: 8000000});
}