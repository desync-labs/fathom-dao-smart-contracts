const fs = require('fs');
const constants = require('./helpers/constants') 
const eventsHelper = require("../tests/helpers/eventsHelper");

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

// const positionMananger = "0xe485eDc3D5aba4dbEcD76a78e6c71c8F5E114F3b"
// const stabilityFeeCollector = "0x62889248B6C81D31D7acc450cc0334D0AA58A14A"
// const xdcAdapter = "0xc3c7f26ffD1cd5ec682E23C076471194DE8ce4f1"
// const stablecoinAdapter = "0x07a2C89774a3F3c57980AD7A528Aea6F262d8939"
// const collateralPoolId = '0x5844430000000000000000000000000000000000000000000000000000000000'
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

    let openPositionTxn = {
        openPositionTxnIdx: txExecute
    }
    let data = JSON.stringify(openPositionTxn);

    fs.writeFileSync(constants.PATH_TO_NEWLY_GENERATED_TRANSACTION_INDEX,data, function(err){
        if(err){
            console.log(err)
        }
    })
    
}