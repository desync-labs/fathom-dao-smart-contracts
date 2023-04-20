const fs = require('fs');
const constants = require('./helpers/constants') 
const eventsHelper = require("../tests/helpers/eventsHelper");
const txnSaver = require('./helpers/transactionSaver')
const txnHelper = require('./helpers/submitAndExecuteTransaction')

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const env = process.env.NODE_ENV || 'dev';
const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);

const rawDataStablecoin = fs.readFileSync(`../../config/stablecoin-addresses-proxy-wallet.${env}.json`);
const addressesStableCoin = JSON.parse(rawDataStablecoin);

const XDC_COL = web3.utils.toWei('2000','ether')
const addressesConfig = require(`../../config/config.${env}`)

const PROXY_WALLET = addressesStableCoin.proxyWallet

const positionMananger = addressesConfig.POSITION_MANAGER_ADDRESS
const stabilityFeeCollector = addressesConfig.STABILIITY_FEE_COLLECTOR_ADDRESS
const xdcAdapter = addressesConfig.COLLATERAL_TOKEN_ADAPTER_ADDRESS
const stablecoinAdapter = addressesConfig.STABLE_COIN_ADAPTER_ADDRESS
const collateralPoolId = addressesConfig.collateralPoolId

const stablecoinAmount = web3.utils.toWei('3','ether')
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
    await txnHelper.submitAndExecute(
        _encodeExecute(openPostionCallEncoded),
        PROXY_WALLET,
        "openPositionTransaction",
        XDC_COL
    )   
}