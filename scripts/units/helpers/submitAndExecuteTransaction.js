const fs = require('fs');
const constants = require('./constants') 
const txnSaver = require('./transactionSaver')

const eventsHelper = require("../../tests/helpers/eventsHelper");

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");

// Load the appropriate addresses file based on the NODE_ENV environment variable
const env = process.env.NODE_ENV || 'dev';
const addressesFilePath = `../../../addresses.${env}.json`;

const rawdata = fs.readFileSync(addressesFilePath);
const addresses = JSON.parse(rawdata);

const createTransactionObject = (TransactionName, tx, resultSubmitTransaction, resultConfirmTransaction, resultExecuteTransaction) => {
    let submitTransactionHash = resultSubmitTransaction ? resultSubmitTransaction.transactionHash : 'Not Submitted';
    let confirmationTransactionHash = resultConfirmTransaction ? resultConfirmTransaction.transactionHash : 'Not Confirmed';
    let executeTransactionHash = resultExecuteTransaction ? resultExecuteTransaction.transactionHash : 'Not Executed';

    let transactionObject = {
        TransactionName: TransactionName,
        tx: tx,
        submitTransactionHash: submitTransactionHash,
        confirmationTransactionHash: confirmationTransactionHash,
        executeTransactionHash: executeTransactionHash,
  };
  return transactionObject;
}
//@note: We can use this to generate encoded function as required
//@note: To do it comment out this line: await _submitExecuteAndSaveTransaction();
async function submitAndExecute(encodedFunction, targetAddress, TransactionName, ETH_AMOUNT=0, shouldExecute = true) {
    
    const MULTISIG_WALLET_ADDRESS = addresses.multiSigWallet;
    const multiSigWallet = await IMultiSigWallet.at(MULTISIG_WALLET_ADDRESS);

    const _submitAndExecute = async() => {
        const resultSubmitTransaction = await multiSigWallet.submitTransaction(
            targetAddress,
            ETH_AMOUNT==0?constants.EMPTY_BYTES:ETH_AMOUNT,
            encodedFunction
            ,0,{gas:20000000}
        )
        if (!resultSubmitTransaction) {
            console.log(`Transaction failed to submit for ${TransactionName}`);
            return createTransactionObject(TransactionName, '', resultSubmitTransaction, {}, {});
        } else {
            console.log(`Transaction submitted successfully for ${TransactionName}. TxHash: ${resultSubmitTransaction.transactionHash}`);
        }

        const tx = eventsHelper.getIndexedEventArgs(resultSubmitTransaction, constants.SUBMIT_TRANSACTION_EVENT)[0];
        const resultConfirmTransaction =await multiSigWallet.confirmTransaction(tx, {gas: 8000000});
        if (!resultConfirmTransaction) {
            console.log(`Transaction failed to confirm for ${TransactionName}`);
            return createTransactionObject(TransactionName, tx, resultSubmitTransaction, resultConfirmTransaction, {});
        } else {
            console.log(`Transaction confirmed successfully for ${TransactionName}. TxHash: ${resultConfirmTransaction.transactionHash}`);
        }
        let resultExecuteTransaction
        
        if(shouldExecute){
            resultExecuteTransaction = await multiSigWallet.executeTransaction(tx, {gas: 8000000});
            if (!resultExecuteTransaction) {
                console.log(`Transaction failed to execute for ${TransactionName}`);
                return createTransactionObject(TransactionName, tx, resultSubmitTransaction, resultConfirmTransaction, resultExecuteTransaction);
            } else {
                console.log(`Transaction executed successfully for ${TransactionName}. TxHash: ${resultExecuteTransaction.transactionHash}`);
            }
        }
        return createTransactionObject(TransactionName, tx, resultSubmitTransaction, resultConfirmTransaction, resultExecuteTransaction);
    }

    const _submitExecuteAndSaveTransaction = async() => {

        const transactionObject = await _submitAndExecute()
        await txnSaver.saveTransaction(
            transactionObject.TransactionName,
            transactionObject.tx,
            transactionObject.submitTransactionHash,
            transactionObject.confirmationTransactionHash,
            transactionObject.executeTransactionHash)
    }
    console.log(`encoded function for the transaction --${TransactionName} is: ${encodedFunction}`)

    //@note:  comment out this line: await _submitExecuteAndSaveTransaction(); to only have console of the encodings
    await _submitExecuteAndSaveTransaction();
    
}

module.exports = {
    submitAndExecute
}