const fs = require('fs');

const eventsHelper = require("../tests/helpers/eventsHelper");
const txnHelper = require('./helpers/transactionSaver')
const constants = require('./helpers/constants')
const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");

const T_TO_TRANSFER_PLACEHOLDER = web3.utils.toWei('10000000','ether') //SET AS NEEDED
const TRANSFER_TO_ACCOUNT_PLACEHOLDER = "0x746a59A8F41DdC954542B6697954a94868126885" //SET AS NEEDED

const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);
const _encodeTransferFunction = (_account, t_to_stake) => {

    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'transfer',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'to'
        },{
            type: 'uint256',
            name: 'amount'
        }]
    }, [_account, t_to_stake]);

    return toRet;
}

module.exports = async function(deployer) {
    
    const MULTISIG_WALLET_ADDRESS = addresses.multiSigWallet;
  //  const FATHOM_TOKEN_ADDRESS  = "0x2e695811dE9E52D69574a9DF3cD53deDa9f9AbAC";
    const FATHOM_TOKEN_ADDRESS  = addresses.fthmToken;

    const multiSigWallet = await IMultiSigWallet.at(MULTISIG_WALLET_ADDRESS)

    const _transferFromMultiSigTreasury = async (_account, _value) => {
        const result = await multiSigWallet.submitTransaction(
            FATHOM_TOKEN_ADDRESS, 
            constants.EMPTY_BYTES, 
            _encodeTransferFunction(_account, _value),
            0,
            {gas: 8000000}
        );
        txIndex = eventsHelper.getIndexedEventArgs(result, constants.SUBMIT_TRANSACTION_EVENT)[0];
        await multiSigWallet.confirmTransaction(txIndex, {gas: 8000000});
        try{
            const executeResult = await multiSigWallet.executeTransaction(txIndex, {gas: 8000000});
        }catch(error){
            //why doesnt it catch?
        }
        
        await txnHelper.saveTxnIndex("transferFathomTokenFromMultisig", txIndex)   
    }

    await _transferFromMultiSigTreasury(TRANSFER_TO_ACCOUNT_PLACEHOLDER,T_TO_TRANSFER_PLACEHOLDER);
}