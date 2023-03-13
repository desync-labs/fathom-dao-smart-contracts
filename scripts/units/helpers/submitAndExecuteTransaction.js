const fs = require('fs');
const constants = require('./constants') 
const txnSaver = require('./transactionSaver')

const eventsHelper = require("../../tests/helpers/eventsHelper");

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const rawdata = fs.readFileSync('../../../addresses.json');
const addresses = JSON.parse(rawdata);

async function submitAndExecute(encodedFunction, targetAddress, TransactionName, ETH_AMOUNT=0) {
    const MULTISIG_WALLET_ADDRESS = addresses.multiSigWallet;
    const multiSigWallet = await IMultiSigWallet.at(MULTISIG_WALLET_ADDRESS);

    const _submitAndExecute = async() => {
        const result = await multiSigWallet.submitTransaction(
            targetAddress,
            ETH_AMOUNT==0?constants.EMPTY_BYTES:ETH_AMOUNT,
            encodedFunction
            ,0,{gas:8000000}
        )
        const tx = eventsHelper.getIndexedEventArgs(result, constants.SUBMIT_TRANSACTION_EVENT)[0];
        await multiSigWallet.confirmTransaction(tx, {gas: 8000000});
        await multiSigWallet.executeTransaction(tx, {gas: 8000000});
        await txnSaver.saveTxnIndex(TransactionName,tx)
    }

    await _submitAndExecute()
}

module.exports = {
    submitAndExecute
}