const fs = require('fs');
const constants = require('./helpers/constants')
const txnHelper = require('./helpers/submitAndExecuteTransaction')
const {getCurrentTimestamp} = require("./helpers/xdc3UtilsHelper")

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);
const IERC20 = artifacts.require("./dao/tokens/ERC20/IERC20.sol");
const IUniswapFactory = artifacts.require("./dao/test/dex/IUniswapV2Factory.sol");
const IUniswapRouter = artifacts.require("./dao/test/dex/IUniswapV2Router01.sol");
const IUniswapV2Pair = artifacts.require("./dao/test/dex/IUniswapV2Pair.sol");

const env = process.env.NODE_ENV || 'dev';
const addressesConfig = require(`../../config/config.${env}`);
const { default: BigNumber } = require('bignumber.js');

const Token_A_Address =  "0xD033b52657F3580092914e1976715e0cbC622855" //USD
const Token_B_Address =  "0x603B972D894bF754B63103ECB4b70b024096451D" //WXDC

// SET AS Necessary
const LIQUIDITY = web3.utils.toWei('99999.999999999999999', 'ether')
const Amount_A_Minimum = web3.utils.toWei('1', 'ether')
const Amount_B_Minimum = web3.utils.toWei('1', 'ether')
const SLIPPAGE = 0.05
// const Amount_A_Desired = web3.utils.toWei('250000', 'ether')
// const Amount_B_Desired = web3.utils.toWei('9347335', 'ether')
// const Amount_A_Minimum = web3.utils.toWei('200000', 'ether')
// const Amount_B_Minimum = web3.utils.toWei('9000000', 'ether')
//What should
const DEX_ROUTER_ADDRESS = addressesConfig.DEX_ROUTER_ADDRESS


const _encodeRemoveLiquidity = (
    _tokenA,
    _tokenB,
    _liquidity,
    _amountAMin,
    _amountBMin,
    _to,
    _deadline
) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'removeLiquidity',
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
            name: 'liquidity'
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
        _liquidity,
        _amountAMin,
        _amountBMin,
        _to,
        _deadline]);

    return toRet;
}

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


module.exports = async function(deployer) {
    const multiSigWallet = await IMultiSigWallet.at(addresses.multiSigWallet);
    //Will need to change it once it expires
    const deadline =  await getDeadlineTimestamp(1000)
    const uniswapFactory = await IUniswapFactory.at(addressesConfig.DEX_FACTORY_ADDRESS)
    const pairAddress = await uniswapFactory.getPair(Token_A_Address, Token_B_Address)
    const pairToken = await IUniswapV2Pair.at(pairAddress)
    
    const balance = (await pairToken.balanceOf(multiSigWallet.address)).toString()
    const reserves = await pairToken.getReserves();
    const token0 = await pairToken.token0();
    const token1 = await pairToken.token1();
    const reserve0 = (Token_A_Address.toLowerCase() === token0.toLowerCase()) ? reserves[0] : reserves[1];
    const reserve1 = (Token_B_Address.toLowerCase() === token0.toLowerCase()) ? reserves[0] : reserves[1];

    const totalSupply = await pairToken.totalSupply();
    const amountADesired = reserve0.mul(balance).div(totalSupply);
    const amountBDesired = reserve1.mul(balance).div(totalSupply);
    const minAmountA = new BigNumber(amountADesired - amountADesired * SLIPPAGE)
    const minAmountB = new BigNumber(amountBDesired - amountBDesired * SLIPPAGE)
    
    // await txnHelper.submitAndExecute(
    //     _encodeApproveFunction(
    //         addressesConfig.DEX_ROUTER_ADDRESS,
    //         balance
    //     )
    //     ,pairAddress,
    //     "ApproveTxn",
    //     0
    // )
    
    await txnHelper.submitAndExecute(
        _encodeRemoveLiquidity(
            Token_A_Address,
            Token_B_Address,
            balance,
            minAmountA,
            minAmountB,
            multiSigWallet.address,
            deadline
        ),
        DEX_ROUTER_ADDRESS,
        "RemoveLiqudity",
        0
    )
}
  

async function getDeadlineTimestamp(deadline) {
    return Math.floor(Date.now() / 1000) + deadline
}

