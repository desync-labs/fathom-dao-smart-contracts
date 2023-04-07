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
        const resultSubmitTransaction = await multiSigWallet.submitTransaction(
            targetAddress,
            ETH_AMOUNT==0?constants.EMPTY_BYTES:ETH_AMOUNT,
            encodedFunction
            ,0,{gas:8000000}
        )
        if (!resultSubmitTransaction) {
            console.log(`Transaction failed to submit for ${TransactionName}`);
            return;
        } else {
            console.log(`Transaction submitted successfully for ${TransactionName}. TxHash: ${resultSubmitTransaction.transactionHash}`);
        }

        const tx = eventsHelper.getIndexedEventArgs(resultSubmitTransaction, constants.SUBMIT_TRANSACTION_EVENT)[0];
        const resultConfirmTransaction =await multiSigWallet.confirmTransaction(tx, {gas: 8000000});
        if (!resultConfirmTransaction) {
            console.log(`Transaction failed to confirm for ${TransactionName}`);
            return;
        } else {
            console.log(`Transaction confirmed successfully for ${TransactionName}. TxHash: ${resultConfirmTransaction.transactionHash}`);
        }
        
        const resultExecuteTransaction = await multiSigWallet.executeTransaction(tx, {gas: 8000000});
        if (!resultExecuteTransaction) {
            console.log(`Transaction failed to execute for ${TransactionName}`);
            return;
        } else {
            console.log(`Transaction executed successfully for ${TransactionName}. TxHash: ${resultExecuteTransaction.transactionHash}`);
        }

        await txnSaver.saveTxnIndex(TransactionName,tx)
    }

    await _submitAndExecute()
}

module.exports = {
    submitAndExecute
}