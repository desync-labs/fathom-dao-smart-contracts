const fs = require('fs');
const constants = require('./helpers/constants')
const {getCurrentTimestamp} = require("./helpers/xdc3UtilsHelper")

const txnHelper = require('./helpers/submitAndExecuteTransaction')

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);

const rawdataExternal = fs.readFileSync(constants.PATH_TO_ADDRESSES_EXTERNAL);
const addressesExternal = JSON.parse(rawdataExternal);

const Token_A_Address_To = "0x82b4334F5CD8385f55969BAE0A863a0C6eA9F63f" //USD+
const Token_B_Address_FROM = "0xE99500AB4A413164DA49Af83B9824749059b46ce" //WXDC

const AMOUNT_OUT_TOKEN_A = web3.utils.toWei('2', 'ether')
const AMOUNT_IN_TOKEN_B = web3.utils.toWei('0', 'ether')

const DEX_ROUTER_ADDRESS = addressesExternal.DEX_ROUTER_ADDRESS
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

const _encodeSwapTokensForExactTokens = (
    _amountIn,
    _amountOutMin,
    _path,
    _to,
    _deadline
) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'swapTokensForExactTokens',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: 'amountOut'
        },
        {
            type: 'uint256',
            name: 'amountInMax'
        },
        {
            type: 'address[]',
            name: 'path'
        },
        {
            type: 'address',
            name: 'to'
        },
        {
            type: 'uint256',
            name: 'deadline'
        },
       ]
    }, [_amountIn,
        _amountOutMin,
        _path,
        _to,
        _deadline]);

    return toRet;
}


module.exports = async function(deployer) {
    const multiSigWallet = await IMultiSigWallet.at(addresses.multiSigWallet);
    const deadline =  await getDeadlineTimestamp(10000)/* ZERO_AM_UAE_TIME_SEVENTEEN_FEB_TIMESTAMP*/+ 100 * 86400 //NOTE: Please change it

    const path = [Token_A_Address_To, Token_B_Address_FROM]
    await txnHelper.submitAndExecute(
        _encodeApproveFunction(DEX_ROUTER_ADDRESS,AMOUNT_IN_TOKEN_B),
        Token_B_Address_FROM,
        "ApproveTokenForSwap"
    )

    await txnHelper.submitAndExecute(
        _encodeSwapTokensForExactTokens(
            AMOUNT_OUT_TOKEN_A,
            AMOUNT_IN_TOKEN_B,
            path,
            multiSigWallet.address,
            deadline
        ),
        DEX_ROUTER_ADDRESS,
        "SwapTokensForExactTokens",
    )
}
  
async function getDeadlineTimestamp(deadline) {
    return (await getCurrentTimestamp()) + deadline
}