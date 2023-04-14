const fs = require('fs');

const eventsHelper = require("../tests/helpers/eventsHelper");
const txnSaver = require('./helpers/transactionSaver')
const constants = require('./helpers/constants')

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");

const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);

const addressesConfig = require('../../config/config')
const STABLE_SWAP_ADDRESS = addressesConfig.STABLE_SWAP_ADDRESS
const USDAddress = addressesConfig.USD_ADDRESS
const FXDAddress = addressesConfig.FXD_ADDRESS
//const STABLE_SWAP_ADDRESS = "";
const USDDepositAmount = web3.utils.toWei('400000','ether')
const FXDDepositAmount = web3.utils.toWei('400000','ether')
// const USDAddress = ""
// const FXDAddress = ""
const _encodeApproveFunction = (_account, _amount) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'approve',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'spender'
        },{
            type: 'uint256',
            name: 'amount'
        }]
    }, [_account, _amount]);

    return toRet;
}

const _encodeDepositFunction = (_token, _amount) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'depositToken',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_token'
        },{
            type: 'uint256',
            name: '_amount'
        }]
    }, [_token, _amount]);

    return toRet;
}

module.exports = async function(deployer) {
    const multiSigWallet = await IMultiSigWallet.at(addresses.multiSigWallet);

    const approveUSD = async() =>{
        let resultApproveUSD = await multiSigWallet.submitTransaction(
            USDAddress,
            constants.EMPTY_BYTES,
            _encodeApproveFunction(STABLE_SWAP_ADDRESS,USDDepositAmount),
            0,
            {gas: 8000000}
        )
        let txIndexApproveUSD = eventsHelper.getIndexedEventArgs(resultApproveUSD, constants.SUBMIT_TRANSACTION_EVENT)[0];
        await multiSigWallet.confirmTransaction(txIndexApproveUSD, {gas: 8000000});
        await multiSigWallet.executeTransaction(txIndexApproveUSD, {gas: 8000000});
        return txIndexApproveUSD
    }
        
    const approveFXD = async () => {
        

        let resultApproveFXD = await multiSigWallet.submitTransaction(
            FXDAddress,
            constants.EMPTY_BYTES,
            _encodeApproveFunction(STABLE_SWAP_ADDRESS,FXDDepositAmount),
            0,
            {gas: 8000000}
        )

        let txIndexApproveFXD = eventsHelper.getIndexedEventArgs(resultApproveFXD, constants.SUBMIT_TRANSACTION_EVENT)[0];
        await multiSigWallet.confirmTransaction(txIndexApproveFXD, {gas: 8000000});
        await multiSigWallet.executeTransaction(txIndexApproveFXD, {gas: 8000000});
        return txIndexApproveFXD
    }
    

    const depositUSD = async() => {
        let resultDepositUSD = await multiSigWallet.submitTransaction(
            STABLE_SWAP_ADDRESS,
            constants.EMPTY_BYTES,
            _encodeDepositFunction(
                USDAddress,
                USDDepositAmount
            ),0,{gas: 8000000}
        )
        
        let txIndexDepositUSD= eventsHelper.getIndexedEventArgs(resultDepositUSD, constants.SUBMIT_TRANSACTION_EVENT)[0];
        await multiSigWallet.confirmTransaction(txIndexDepositUSD, {gas: 8000000});
        await multiSigWallet.executeTransaction(txIndexDepositUSD, {gas: 8000000});
        return txIndexDepositUSD
    }


    
    const depositFXD = async() =>{
        let resultDepositFXD = await multiSigWallet.submitTransaction(
            STABLE_SWAP_ADDRESS,
            constants.EMPTY_BYTES,
            _encodeDepositFunction(
                FXDAddress,
                FXDDepositAmount
            ),0,{gas: 8000000}
        )
        
        let txIndexDepositFXD = eventsHelper.getIndexedEventArgs(resultDepositFXD, constants.SUBMIT_TRANSACTION_EVENT)[0];
        await multiSigWallet.confirmTransaction(txIndexDepositFXD, {gas: 8000000});
        await multiSigWallet.executeTransaction(txIndexDepositFXD, {gas: 8000000});
        return txIndexDepositFXD

    }

    let txIndexApproveUSD = await approveUSD();
    let txIndexApproveFXD = await approveFXD();
    let txIndexDepositUSD = await depositUSD();
    let txIndexDepositFXD = await depositFXD();
    await txnSaver.saveTxnIndex("txIndexApproveUSD",txIndexApproveUSD)
    await txnSaver.saveTxnIndex("txIndexApproveFXD",txIndexApproveFXD)
    await txnSaver.saveTxnIndex("txIndexDepositUSD",txIndexDepositUSD)
    await txnSaver.saveTxnIndex("txIndexDepositFXD",txIndexDepositFXD)
}
