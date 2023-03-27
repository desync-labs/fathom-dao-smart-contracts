const fs = require('fs');
const constants = require('./helpers/constants')

const txnHelper = require('./helpers/submitAndExecuteTransaction')

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);
const IUniswapRouter = artifacts.require("./dao/test/dex/IUniswapV2Router01.sol");

const rawdataExternal = fs.readFileSync(constants.PATH_TO_ADDRESSES_EXTERNAL);
const addressesExternal = JSON.parse(rawdataExternal);

const Token_A_Address = "0x82b4334F5CD8385f55969BAE0A863a0C6eA9F63f" //USD+
const Token_B_Address = "0xE99500AB4A413164DA49Af83B9824749059b46ce" //WXDC

const AMOUNT_IN_TOKEN_A = '2'
const SLIPPAGE = 0.05

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

const _encodeSwapExactTokensForTokens = (
    _amountIn,
    _amountOutMin,
    _path,
    _to,
    _deadline
) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'swapExactTokensForTokens',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: 'amountIn'
        },
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
    }, [_amountIn,
        _amountOutMin,
        _path,
        _to,
        _deadline]);

    return toRet;
}


module.exports = async function(deployer) {
    //swap exact tokens for tokens

    
    const multiSigWallet = await IMultiSigWallet.at(addresses.multiSigWallet);
    const uniswapRouter = await IUniswapRouter.at(addressesExternal.DEX_ROUTER_ADDRESS)
    //amounts In is the fixed amount you want to give to the uniswap pool
    const amountIn = web3.utils.toWei(AMOUNT_IN_TOKEN_A, 'ether')
    //now, we set path where Token A is swapped to Token B
    const path = [Token_A_Address, Token_B_Address] // swap from TokenA to receive TokenB
    // we get amountsOut from the router which gives us the value of how much amount we can receive
    const amounts = await uniswapRouter.getAmountsOut(amountIn,path)
    // we caculate minimum amount of tokens we want with slippage as percentage subtracted from amount
    const amountOut = String(amounts[1] - (amounts[1] * SLIPPAGE))
    const deadline =  await getDeadlineTimestamp(10000)

    
    await txnHelper.submitAndExecute(
        _encodeApproveFunction(DEX_ROUTER_ADDRESS,AMOUNT_IN_TOKEN_A),
        Token_A_Address,
        "ApproveTokenForSwap"
    )

    await txnHelper.submitAndExecute(
        _encodeSwapExactTokensForTokens(
            amountIn,
            amountOut,
            path,
            multiSigWallet.address,
            deadline
        ),
        DEX_ROUTER_ADDRESS,
        "swapExactTokensForTokens",
    )
}
  
async function getDeadlineTimestamp(deadline) {
    return Math.floor(Date.now() / 1000) + deadline
}