const fs = require('fs');
const constants = require('./helpers/constants')
const txnHelper = require('./helpers/submitAndExecuteTransaction')
const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const IUniswapRouter = artifacts.require("./dao/test/dex/IUniswapV2Router01.sol");

const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);
const addressesConfig = require('../../config/config.js')
const WETH_ADDRESS = addressesConfig.WETH_ADDRESS
const TOKEN_ADDRESS = addresses.fthmToken //FTHM address

const AMOUNT_ETH = web3.utils.toWei('100', 'ether')
const AMOUNT_ETH_MIN = web3.utils.toWei('50', 'ether')
const SLIPPAGE = 0.05
//const DEX_ROUTER_ADDRESS = "0x05b0e01DD9737a3c0993de6F57B93253a6C3Ba95"//old router
const DEX_ROUTER_ADDRESS = addressesConfig.DEX_ROUTER_ADDRESS

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
            type: 'uint256',
            name: 'amountTokenDesired'
        },
        {
            type: 'uint256',
            name: 'amountTokenMin'
        },
        {
            type: 'uint256',
            name: 'amountETHMin'
        },
        {
            type: 'address',
            name: 'to'
        },
        {
            type: 'uint256',
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
    const deadline =  await getDeadlineTimestamp(10000)
    const uniswapRouter = await IUniswapRouter.at(addressesConfig.DEX_ROUTER_ADDRESS)

    //ReserveA/ReserveB = (ReserveA + QTYA)/(ReserveB + QTYB)
    //ReserveA*ReserveB + ReserveA*QTYB = ReserveA*ReserveB +ReserveB*QRYA
    //ie, ReserveA*QTYB =  ReserveB*QTYA
    //Get Amounts out ie, if we give AMOUNT_ETH of ETH how much token we can receive back as Token
    const TOKEN_AMOUNT = await uniswapRouter.getAmountsOut(AMOUNT_ETH,[WETH_ADDRESS,TOKEN_ADDRESS])
    //Account for slippage 
    const TOKEN_AMOUNT_MAX = String(TOKEN_AMOUNT[1] + (TOKEN_AMOUNT[1]*SLIPPAGE))
    const TOKEN_AMOUNT_MIN = String(TOKEN_AMOUNT[1] - (TOKEN_AMOUNT[1]*SLIPPAGE))

    await txnHelper.submitAndExecute(
        _encodeApproveFunction(DEX_ROUTER_ADDRESS,TOKEN_AMOUNT_MAX),
        TOKEN_ADDRESS,
        "ApproveDexXDC"
    )

    await txnHelper.submitAndExecute(
        _encodeAddLiqudityFunction(
            TOKEN_ADDRESS,
            TOKEN_AMOUNT_MAX,
            TOKEN_AMOUNT_MIN,
            AMOUNT_ETH_MIN,
            multiSigWallet.address,
            deadline
        ),
        DEX_ROUTER_ADDRESS,
        "createPoolWithXDC",
        AMOUNT_ETH
    )
}
  
async function getDeadlineTimestamp(deadline) {
    return Math.floor(Date.now() / 1000) + deadline
}