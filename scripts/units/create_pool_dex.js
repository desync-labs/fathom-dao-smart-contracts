const fs = require('fs');
const constants = require('./helpers/constants')

const txnHelper = require('./helpers/submitAndExecuteTransaction')

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);

const rawdataExternal = fs.readFileSync(constants.PATH_TO_ADDRESSES_EXTERNAL);
const addressesExternal = JSON.parse(rawdataExternal);


const Token_A_Address = "0x82b4334F5CD8385f55969BAE0A863a0C6eA9F63f" //USD+
const Token_B_Address = "0xE99500AB4A413164DA49Af83B9824749059b46ce" //WXDC
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
    const deadline =  1676577600/* ZERO_AM_UAE_TIME_SEVENTEEN_FEB_TIMESTAMP*/+ 100 * 86400 //NOTE: Please change it
    
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
  

