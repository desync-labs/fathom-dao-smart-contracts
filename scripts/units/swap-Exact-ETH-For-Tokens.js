const fs = require('fs');
const constants = require('./helpers/constants')
const {getCurrentTimestamp} = require("./helpers/xdc3UtilsHelper")

const txnHelper = require('./helpers/submitAndExecuteTransaction')

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);
const IUniswapRouter = artifacts.require("./dao/test/dex/IUniswapV2Router01.sol");

const rawdataExternal = fs.readFileSync(constants.PATH_TO_ADDRESSES_EXTERNAL);
const addressesExternal = JSON.parse(rawdataExternal);
const WETH_ADDRESS = addressesExternal.WETH_ADDRESS
const TOKEN_ADDRESS = "0x3f680943866a8b6DBb61b4712c27AF736BD2fE9A" //WXDC

const AMOUNT_IN_ETH = '2'
const SLIPPAGE = 0.05

const DEX_ROUTER_ADDRESS = addressesExternal.DEX_ROUTER_ADDRESS

const _encodeSwapExactETHForTokens = (
    _amountOutMin,
    _path,
    _to,
    _deadline
) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'swapExactETHForTokens',
        type: 'function',
        inputs: [
        {
            type: 'uint256',
            name: 'amountOutMin'
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
    }, [_amountOutMin,
        _path,
        _to,
        _deadline]);

    return toRet;
}


module.exports = async function(deployer) {
    
    const multiSigWallet = await IMultiSigWallet.at(addresses.multiSigWallet);
    const uniswapRouter = await IUniswapRouter.at(addressesExternal.DEX_ROUTER_ADDRESS)
    const path = [WETH_ADDRESS, TOKEN_ADDRESS] 
    const amountIn = web3.utils.toWei(AMOUNT_IN_ETH, 'ether')
    const amounts = await uniswapRouter.getAmountsOut(amountIn,path)
    const amountOut = String(amounts[1] - (amounts[1] * SLIPPAGE))
    const deadline =  await getDeadlineTimestamp(10000)/* ZERO_AM_UAE_TIME_SEVENTEEN_FEB_TIMESTAMP*/+ 100 * 86400 //NOTE: Please change it

    await txnHelper.submitAndExecute(
        _encodeSwapExactETHForTokens(
            amountOut,
            path,
            multiSigWallet.address,
            deadline
        ),
        DEX_ROUTER_ADDRESS,
        "SwapExactETHForTokens",
        amountIn
    )
}
  
async function getDeadlineTimestamp(deadline) {
    return Math.floor(Date.now() / 1000) + deadline
}