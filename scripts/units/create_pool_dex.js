const fs = require('fs');
const constants = require('./helpers/constants')

const txnHelper = require('./helpers/submitAndExecuteTransaction')
const {getCurrentTimestamp} = require("./helpers/xdc3UtilsHelper")

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);


const env = process.env.NODE_ENV || 'dev';
const addressesConfig = require(`../../config/config.${env}`)


const Token_A_Address = addressesConfig.USD_ADDRESS //USD
const Token_B_Address =  addressesConfig.WETH_ADDRESS //WXDC
// SET AS Necessary
const Amount_A_Desired = web3.utils.toWei('2', 'ether')
const Amount_B_Desired = web3.utils.toWei('38', 'ether')
const Amount_A_Minimum = web3.utils.toWei('1', 'ether')
const Amount_B_Minimum = web3.utils.toWei('1', 'ether')

// const Amount_A_Desired = web3.utils.toWei('250000', 'ether')
// const Amount_B_Desired = web3.utils.toWei('9347335', 'ether')
// const Amount_A_Minimum = web3.utils.toWei('200000', 'ether')
// const Amount_B_Minimum = web3.utils.toWei('9000000', 'ether')
//What should
//const DEX_ROUTER_ADDRESS = "0xF0392b8A2ea9567dFa900dDb0C2E4296bC061A4C" //SET NEW ROUTER
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
    //Will need to change it once it expires
    const deadline =  await getDeadlineTimestamp(1000)
    
    await txnHelper.submitAndExecute(
        _encodeApproveFunction(DEX_ROUTER_ADDRESS,Amount_A_Desired),
        Token_A_Address,
        "ApproveTokenA",
        0
    )
    
    await txnHelper.submitAndExecute(
        _encodeApproveFunction(DEX_ROUTER_ADDRESS,Amount_B_Desired),
        Token_B_Address,
        "ApproveTokenB",
        0
    )
    await txnHelper.submitAndExecute(
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
        DEX_ROUTER_ADDRESS,
        "ApproveToken",
        0
    )
}
  

async function getDeadlineTimestamp(deadline) {
    return Math.floor(Date.now() / 1000) + deadline
}

