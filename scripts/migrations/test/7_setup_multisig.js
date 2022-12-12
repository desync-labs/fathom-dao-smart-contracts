const eventsHelper = require("../../tests/helpers/eventsHelper");

const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");

const EMPTY_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000';
const SUBMIT_TRANSACTION_EVENT = "SubmitTransaction(uint256,address,address,uint256,bytes)";

const COUNCIL_1 = "0xc0Ee98ac1a44B56fbe2669A3B3C006DEB6fDd0f9";

const NEW_MULTISIG_REQUIREMENT = 2;

const _encodeAddOwnerFunction = (_account) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'addOwner',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'owner'
        }]
    }, [_account]);

    return toRet;
}

const _encodeChangeRequirementFunction = (number) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'changeRequirement',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: '_required'
        }]
    }, [number]);

    return toRet;
}

module.exports = async function(deployer) {
    const multiSigWallet = await IMultiSigWallet.at(MultiSigWallet.address);

    let result = await multiSigWallet.submitTransaction(
        multiSigWallet.address, 
        EMPTY_BYTES,
        _encodeAddOwnerFunction(COUNCIL_1),
        {gas: 8000000}
    );

    txIndex = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];

    await multiSigWallet.confirmTransaction(txIndex, {gas: 8000000});
    await multiSigWallet.executeTransaction(txIndex, {gas: 8000000});

    result = await multiSigWallet.submitTransaction(
        multiSigWallet.address, 
        EMPTY_BYTES,
        _encodeChangeRequirementFunction(NEW_MULTISIG_REQUIREMENT),
        {gas: 8000000}
    );

    txIndex = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];

    await multiSigWallet.confirmTransaction(txIndex, {gas: 8000000});
    await multiSigWallet.executeTransaction(txIndex, {gas: 8000000});
}