const fs = require('fs');
const constants = require('./helpers/constants') 
const eventsHelper = require("../tests/helpers/eventsHelper");
const txnSaver = require('./helpers/transactionSaver')

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");

const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);
const rawDataStablecoin = fs.readFileSync('../../config/stablecoin-addresses-proxy-wallet.json');
const addressesStableCoin = JSON.parse(rawDataStablecoin);
const XDC_COL = web3.utils.toWei('20','ether')
const rawdataExternal = fs.readFileSync(constants.PATH_TO_ADDRESSES_EXTERNAL);
const addressesExternal = JSON.parse(rawdataExternal);

//xdcBe6f6500C3e45a78E17818570b99a7646F8b59F3
const PROXY_WALLET = addressesStableCoin.proxyWallet

const positionMananger = addressesExternal.positionManager
const stabilityFeeCollector = addressesExternal.stabilityFeeCollector
const xdcAdapter = addressesExternal.xdcAdapter
const stablecoinAdapter = addressesExternal.stablecoinAdapter
const collateralPoolId = addressesExternal.collateralPoolId

const stablecoinAmount = web3.utils.toWei('5')
const data  = "0x00"


const _encodeOpenPositionCall = (
    _manager,
    __stabilityFeeCollector,
    _xdcAdapter,
    _stablecoinAdapter,
    _collateralPoolId,
    _stablecoinAmount,
    _data) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'openLockXDCAndDraw',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_manager'
        },{
            type: 'address',
            name: '_stabilityFeeCollector'
        },{
            type: 'address',
            name: '_xdcAdapter'
        },{
            type: 'address',
            name: '_stablecoinAdapter'
        },{
            type: 'bytes32',
            name: '_collateralPoolId'
        },{
            type: 'uint256',
            name: '_stablecoinAmount'
        },{
            type: 'bytes',
            name: '_data'
        }]
    }, [_manager,
        __stabilityFeeCollector,
        _xdcAdapter,
        _stablecoinAdapter,
        _collateralPoolId,
        _stablecoinAmount,
        _data]);

    return toRet;
}

const _encodeExecute = (_data) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'execute',
        type: 'function',
        inputs: [{
            type: 'bytes',
            name: 'data'
        }]
    }, [_data]);

    return toRet;
}



module.exports = async function(deployer) {
    const multiSigWallet = await IMultiSigWallet.at(addresses.multiSigWallet);
    let openPostionCallEncoded = _encodeOpenPositionCall(
        positionMananger,
        stabilityFeeCollector,
        xdcAdapter,
        stablecoinAdapter,
        collateralPoolId,
        stablecoinAmount,
        data
    )
    
    let resultExecute = await multiSigWallet.submitTransaction(
        PROXY_WALLET,
        XDC_COL,
        _encodeExecute(openPostionCallEncoded),
        0,
        {gas: 8000000}
    )

    let txExecute = eventsHelper.getIndexedEventArgs(resultExecute, constants.SUBMIT_TRANSACTION_EVENT)[0];
    await multiSigWallet.confirmTransaction(txExecute, {gas: 8000000});
    await multiSigWallet.executeTransaction(txExecute, {gas: 8000000});

    await txnSaver.saveTxnIndex("openPositionTransaction", txExecute)   
}