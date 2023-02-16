const fs = require('fs');

const eventsHelper = require("../tests/helpers/eventsHelper");
const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const EMPTY_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000';
const SUBMIT_TRANSACTION_EVENT = "SubmitTransaction(uint256,address,address,uint256,bytes)";
const rawdata = fs.readFileSync('../../addresses.json');
const addresses = JSON.parse(rawdata);

const TOKEN_ADDRESS = "0x3f680943866a8b6DBb61b4712c27AF736BD2fE9A" //FTHM address
const AMOUNT_TOKEN_DESIRED = web3.utils.toWei('5', 'ether')
const AMOUNT_TOKEN_MIN = web3.utils.toWei('3', 'ether')
const AMOUNT_ETH_MIN = web3.utils.toWei('1', 'ether')
const DEX_ROUTER_ADDRESS = "0x05b0e01DD9737a3c0993de6F57B93253a6C3Ba95"//old router

  
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


const _encodeAddLiqudityFunction = (
    _token,
    _amountTokenDesired,
    _amountTokenMin,
    _amountETHMin,
    _to,
    _deadline
) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'addLiquidityETH',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'token'
        },
        {
            type: 'uint',
            name: 'amountTokenDesired'
        },
        {
            type: 'uint',
            name: 'amountTokenMin'
        },
        {
            type: 'uint',
            name: 'amountETHMin'
        },
        {
            type: 'address',
            name: 'to'
        },
        {
            type: 'uint',
            name: 'deadline'
        }]
    }, [_token,
        _amountTokenDesired,
        _amountTokenMin,
        _amountETHMin,
        _to,
        _deadline]);

    return toRet;
}


module.exports = async function(deployer) {
    const multiSigWallet = await IMultiSigWallet.at(addresses.multiSigWallet);
    const deadline =  1676577600 //ZERO_AM_UAE_TIME_SEVENTEEN_FEB_TIMESTAMP//NOTE: Please change it
    

    let resultApprove = await multiSigWallet.submitTransaction(
        TOKEN_ADDRESS,
        EMPTY_BYTES,
        _encodeApproveFunction(DEX_ROUTER_ADDRESS,AMOUNT_TOKEN_DESIRED),
        0,
        {gas: 8000000}
    )

    let txIndexApprove = eventsHelper.getIndexedEventArgs(resultApprove, SUBMIT_TRANSACTION_EVENT)[0];
    await multiSigWallet.confirmTransaction(txIndexApprove, {gas: 8000000});
    await multiSigWallet.executeTransaction(txIndexApprove, {gas: 8000000});
    let resultAddLiquidity = await multiSigWallet.submitTransaction(
        DEX_ROUTER_ADDRESS,
        AMOUNT_TOKEN_DESIRED,
        _encodeAddLiqudityFunction(
            TOKEN_ADDRESS,
            AMOUNT_TOKEN_DESIRED,
            AMOUNT_TOKEN_MIN,
            AMOUNT_ETH_MIN,
            multiSigWallet.address,
            deadline
        ),
        0,
        {gas: 8000000}
    )
    let txIndexAddLiquidity = eventsHelper.getIndexedEventArgs(resultAddLiquidity, SUBMIT_TRANSACTION_EVENT)[0];
    await multiSigWallet.confirmTransaction(txIndexAddLiquidity, {gas: 8000000});
    await multiSigWallet.executeTransaction(txIndexAddLiquidity, {gas: 15000000});
}
  

