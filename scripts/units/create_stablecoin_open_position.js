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



//{"proxyFactory":"0x2CF7cAe946D97232b4bA0a819B2d5c753fb6C2C5","simplePriceFeedUSDT":"0x981B8c630C46A6AD21686C58a57E2AFD7362d85e","fixedSpreadLiquidationStrategy":"0x754f0573a97cDEe2e47920a582C228e8b0A63a03","proxyWalletRegistry":"0xF11994FBAa365070ce4a1505f9Ce5Ea960d0d904","stabilityFeeCollector":"0x62889248B6C81D31D7acc450cc0334D0AA58A14A",
//"stablecoinAdapter":"0x07a2C89774a3F3c57980AD7A528Aea6F262d8939","showStopper":"0xce3d5feC112C34da459Decfec1bCeF3a6437A5Bc","priceOracle":"0xbCB7f95718d2eB899bB16B861c1e5416EAD36264","fathomStablecoin":"0x08B5860daD9947677F2a9d7DE563cBec9980E44c","positionManager":"0xe485eDc3D5aba4dbEcD76a78e6c71c8F5E114F3b","systemDebtEngine":"0xFd28A89440e005562d0E8CD86C4574021C904FD9","liquidationEngine":"0x73EA9Acb76fC83c3BE5A75F5c6940EA623746Ed4","bookKeeper":"0xf5486A08a1528f97cc7da3eED9050DB2387ADf66","collateralPoolConfig":"0x279750eb5799010A295119f38A32A67723a9e10F","accessControlConfig":"0xaa96E05E5f4a024aaAF399A26F0D4341E420269e","flashMintModule":"0x39FAaef7F24B775fe0dDEB5fc62D819723398f65","stableSwapModule":"0x9F1c95900ca81b46F46cDce9C1762048cBc50CC6","flashMintArbitrager":"0xd7dA7B3F5fA605CDD77F09dB37d07fBc5c680fD0","bookKeeperFlashMintArbitrager":"0x00d42C140C2c448D0a7c1E1562D28D8733621c8E","dexPriceOracle":"0x23Bb26c4a59B28ad496bD3140AC7C95869F35830","proxyWalletFactory":"0x198bcA10F74caDAe58656B223e1D279686E1E672","fathomStablecoinProxyActions":"0x233380A9C66CCB6d2aC2BaEEAde5a509De2bb649","ankrCollateralAdapter":"0xc3c7f26ffD1cd5ec682E23C076471194DE8ce4f1","delayFathomOraclePriceFeed":"0xd2b0E79136E471bf981559A6cE862f793C81701d"}{"51":{"WXDC":"0xE99500AB4A413164DA49Af83B9824749059b46ce","USD":"0x82b4334F5CD8385f55969BAE0A863a0C6eA9F63f","FTHM":"0x0000000000000000000000000000000000000000","DEXFactory":"0xe350508951929D3e19222824F41790621fb18A15", "xdcPool":"0xd458788DD7d2fDbB5238d9eeb0a49732BffF08b7","aXDCc":"0xe27990d8c950038C548E6f4BD0657aCE27495D48"}