const fs = require('fs');
const constants = require('./helpers/constants')

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
    //we want to swap exact eth for tokens
    const multiSigWallet = await IMultiSigWallet.at(addresses.multiSigWallet);
    const uniswapRouter = await IUniswapRouter.at(addressesExternal.DEX_ROUTER_ADDRESS)
    //we set path to swap from WETH and receive Token
    const path = [WETH_ADDRESS, TOKEN_ADDRESS] 
    // we set exact eth that we want to swap
    const amountIn = web3.utils.toWei(AMOUNT_IN_ETH, 'ether')
    // we get how much tokens we can receive for the exact eth
    const amounts = await uniswapRouter.getAmountsOut(amountIn,path)
    // we set slippage to determine lowest amount of Tokens we are willing to receive taking Slippage into account
    const amountOut = String(amounts[1] - (amounts[1] * SLIPPAGE))
    const deadline =  await getDeadlineTimestamp(10000)

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