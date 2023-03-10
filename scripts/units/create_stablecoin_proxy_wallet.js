const fs = require('fs');
const constants = require('./helpers/constants') 
const eventsHelper = require("../tests/helpers/eventsHelper");
const txnHelper = require('./helpers/transactionSaver')

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);
const IProxyRegistry = artifacts.require("./dao/test/stablecoin/IProxyRegistry.sol");
const rawdataExternal = fs.readFileSync(constants.PATH_TO_ADDRESSES_EXTERNAL);
const addressesExternal = JSON.parse(rawdataExternal);
const PROXY_WALLET_REGISTRY_ADDRESS = addressesExternal.PROXY_WALLET_REGISTRY_ADDRESS
//const PROXY_WALLET_REGISTRY_ADDRESS = "0xF11994FBAa365070ce4a1505f9Ce5Ea960d0d904"
const _encodeBuildFunction = (_account) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'build',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'owner'
        }]
    }, [_account]);

    return toRet;
}


module.exports = async function(deployer) {
    const multiSigWallet = await IMultiSigWallet.at(addresses.multiSigWallet);
    const proxyRegistry = await IProxyRegistry.at(PROXY_WALLET_REGISTRY_ADDRESS)
    let resultBuild= await multiSigWallet.submitTransaction(
        PROXY_WALLET_REGISTRY_ADDRESS,
        constants.EMPTY_BYTES,
        _encodeBuildFunction(multiSigWallet.address),
        0,
        {gas: 8000000}
    )
    
    let txIndexBuild = eventsHelper.getIndexedEventArgs(resultBuild, constants.SUBMIT_TRANSACTION_EVENT)[0];
    await multiSigWallet.confirmTransaction(txIndexBuild, {gas: 8000000});
    await multiSigWallet.executeTransaction(txIndexBuild, {gas: 8000000});
    const proxyWalletAddress = await proxyRegistry.proxies(multiSigWallet.address)
    let addressesStableCoin = {
        proxyWallet: proxyWalletAddress
    }
    let data = JSON.stringify(addressesStableCoin);

    fs.writeFileSync('./config/stablecoin-addresses-proxy-wallet.json',data, function(err){
        if(err){
            console.log(err)
        }
    })

    await txnHelper.saveTxnIndex("proxyWalletTxn", txIndexBuild)   
}