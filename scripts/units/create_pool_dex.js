const fs = require('fs');

const eventsHelper = require("../tests/helpers/eventsHelper");

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const EMPTY_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000';
const SUBMIT_TRANSACTION_EVENT = "SubmitTransaction(uint256,address,address,uint256,bytes)";
const rawdata = fs.readFileSync('../../addresses.json');
const addresses = JSON.parse(rawdata);

const Token_A_Address = "0xE99500AB4A413164DA49Af83B9824749059b46ce" //WXDC address
const Token_B_Address = "0x3f680943866a8b6DBb61b4712c27AF736BD2fE9A" //US+ address
const Amount_A_Desired = web3.utils.toWei('3', 'ether')
const Amount_B_Desired = web3.utils.toWei('100', 'ether')
const Amount_A_Minimum = web3.utils.toWei('1', 'ether')
const Amount_B_Minimum = web3.utils.toWei('1', 'ether')
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
    _tokenA,
    _tokenB,
    _amountADesired,
    _amountBDesired,
    _amountAMin,
    _amountBMin,
    _to,
    _deadline
) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'addLiquidity',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'tokenA'
        },
        {
            type: 'address',
            name: 'tokenB'
        },
        {
            type: 'uint256',
            name: 'amountADesired'
        },
        {
            type: 'uint256',
            name: 'amountBDesired'
        },
        {
            type: 'uint256',
            name: 'amountAMin'
        },
        {
            type: 'uint256',
            name: 'amountBMin'
        },
        {
            type: 'address',
            name: 'to'
        },
        {
            type: 'uint256',
            name: 'deadline'
        }]
    }, [_tokenA,
        _tokenB,
        _amountADesired,
        _amountBDesired,
        _amountAMin,
        _amountBMin,
        _to,
        _deadline]);

    return toRet;
}


module.exports = async function(deployer) {
    const multiSigWallet = await IMultiSigWallet.at(addresses.multiSigWallet);
    const deadline =  1676577600 //ZERO_AM_UAE_TIME_SEVENTEEN_FEB_TIMESTAMP//NOTE: Please change it
    let resultApprove_A = await multiSigWallet.submitTransaction(
        Token_A_Address,
        EMPTY_BYTES,
        _encodeApproveFunction(DEX_ROUTER_ADDRESS,Amount_A_Desired),
        0,
        {gas: 8000000}
    )
    
    let txIndexApprove_A = eventsHelper.getIndexedEventArgs(resultApprove_A, SUBMIT_TRANSACTION_EVENT)[0];
    await multiSigWallet.confirmTransaction(txIndexApprove_A, {gas: 8000000});
    await multiSigWallet.executeTransaction(txIndexApprove_A, {gas: 8000000});

    let resultApprove_B = await multiSigWallet.submitTransaction(
        Token_B_Address,
        EMPTY_BYTES,
        _encodeApproveFunction(DEX_ROUTER_ADDRESS,Amount_A_Desired),
        0,
        {gas: 8000000}
    )

    let txIndexApprove_B = eventsHelper.getIndexedEventArgs(resultApprove_B, SUBMIT_TRANSACTION_EVENT)[0];
    await multiSigWallet.confirmTransaction(txIndexApprove_B, {gas: 8000000});
    await multiSigWallet.executeTransaction(txIndexApprove_B, {gas: 8000000});
    
    let resultAddLiquidity = await multiSigWallet.submitTransaction(
        DEX_ROUTER_ADDRESS,
        EMPTY_BYTES,
        _encodeAddLiqudityFunction(
            Token_A_Address,
            Token_B_Address,
            Amount_A_Desired,
            Amount_B_Desired,
            Amount_A_Minimum,
            Amount_B_Minimum,
            multiSigWallet.address,
            deadline
        ),
        0,
        {gas: 8000000}
    )

    let txIndexAddLiquidity = eventsHelper.getIndexedEventArgs(resultAddLiquidity, SUBMIT_TRANSACTION_EVENT)[0];
    await multiSigWallet.confirmTransaction(txIndexAddLiquidity, {gas: 8000000});
    await multiSigWallet.executeTransaction(txIndexAddLiquidity, {gas: 8000000});
}
  
