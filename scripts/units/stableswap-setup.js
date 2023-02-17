const fs = require('fs');

const eventsHelper = require("../tests/helpers/eventsHelper");


const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");

const EMPTY_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000';
const SUBMIT_TRANSACTION_EVENT = "SubmitTransaction(uint256,address,address,uint256,bytes)";
const rawdata = fs.readFileSync('../../addresses.json');
const addresses = JSON.parse(rawdata);

const STABLE_SWAP_ADDRESS = "";
const USDDepositAmount = web3.utils.toWei('400000','ether')
const FXDDepositAmount = web3.utils.toWei('400000','ether')
const USDAddress = ""
const FXDAddress = ""
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
            EMPTY_BYTES,
            _encodeApproveFunction(STABLE_SWAP_ADDRESS,USDDepositAmount),
            0,
            {gas: 8000000}
        )
        let txIndexApproveUSD = eventsHelper.getIndexedEventArgs(resultApproveUSD, SUBMIT_TRANSACTION_EVENT)[0];
        await multiSigWallet.confirmTransaction(txIndexApproveUSD, {gas: 8000000});
        await multiSigWallet.executeTransaction(txIndexApproveUSD, {gas: 8000000});
    }
        
    const approveFXD = async () => {
        

        let resultApproveFXD = await multiSigWallet.submitTransaction(
            FXDAddress,
            EMPTY_BYTES,
            _encodeApproveFunction(STABLE_SWAP_ADDRESS,FXDDepositAmount),
            0,
            {gas: 8000000}
        )

        let txIndexApproveFXD = eventsHelper.getIndexedEventArgs(resultApproveFXD, SUBMIT_TRANSACTION_EVENT)[0];
        await multiSigWallet.confirmTransaction(txIndexApproveFXD, {gas: 8000000});
        await multiSigWallet.executeTransaction(txIndexApproveFXD, {gas: 8000000});
    }
    

    const depositUSD = async() => {
        let resultDepositUSD = await multiSigWallet.submitTransaction(
            STABLE_SWAP_ADDRESS,
            EMPTY_BYTES,
            _encodeDepositFunction(
                USDAddress,
                USDDepositAmount
            ),0,{gas: 8000000}
        )
        
        let txIndexDepositUSD= eventsHelper.getIndexedEventArgs(resultDepositUSD, SUBMIT_TRANSACTION_EVENT)[0];
        await multiSigWallet.confirmTransaction(txIndexDepositUSD, {gas: 8000000});
        await multiSigWallet.executeTransaction(txIndexDepositUSD, {gas: 8000000});
    }


    
    const depositFXD = async() =>{
        let resultDepositFXD = await multiSigWallet.submitTransaction(
            STABLE_SWAP_ADDRESS,
            EMPTY_BYTES,
            _encodeDepositFunction(
                FXDAddress,
                FXDDepositAmount
            ),0,{gas: 8000000}
        )
        
        let txIndexDepositFXD = eventsHelper.getIndexedEventArgs(resultDepositFXD, SUBMIT_TRANSACTION_EVENT)[0];
        await multiSigWallet.confirmTransaction(txIndexDepositFXD, {gas: 8000000});
        await multiSigWallet.executeTransaction(txIndexDepositFXD, {gas: 8000000});
    }

    await approveUSD();
    await approveFXD();
    await depositUSD();
    await depositFXD();
    
}
