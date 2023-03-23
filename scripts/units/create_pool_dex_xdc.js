const fs = require('fs');
const constants = require('./helpers/constants')
const txnHelper = require('./helpers/submitAndExecuteTransaction')
const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);
const rawdataExternal = fs.readFileSync(constants.PATH_TO_ADDRESSES_EXTERNAL);
const addressesExternal = JSON.parse(rawdataExternal);

const TOKEN_ADDRESS = "0x3f680943866a8b6DBb61b4712c27AF736BD2fE9A" //FTHM address
const AMOUNT_TOKEN_DESIRED = web3.utils.toWei('2', 'ether')
const AMOUNT_TOKEN_MIN = web3.utils.toWei('0', 'ether')
const AMOUNT_TOKEN_ETH = web3.utils.toWei('3', 'ether')
const AMOUNT_ETH_MIN = web3.utils.toWei('1', 'ether')

//const DEX_ROUTER_ADDRESS = "0x05b0e01DD9737a3c0993de6F57B93253a6C3Ba95"//old router
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
    
    await txnHelper.submitAndExecute(
        _encodeApproveFunction(DEX_ROUTER_ADDRESS,AMOUNT_TOKEN_DESIRED),
        TOKEN_ADDRESS,
        "ApproveDexXDC"
    )

    await txnHelper.submitAndExecute(
        _encodeAddLiqudityFunction(
            TOKEN_ADDRESS,
            AMOUNT_TOKEN_DESIRED,
            AMOUNT_TOKEN_MIN,
            AMOUNT_ETH_MIN,
            multiSigWallet.address,
            deadline
        ),
        DEX_ROUTER_ADDRESS,
        "createPoolWithXDC",
        AMOUNT_TOKEN_ETH
    )
}
  
async function getDeadlineTimestamp(deadline) {
    return Math.floor(Date.now() / 1000) + deadline
}