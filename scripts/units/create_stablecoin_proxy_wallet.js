const fs = require('fs');

const eventsHelper = require("../tests/helpers/eventsHelper");

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const EMPTY_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000';
const SUBMIT_TRANSACTION_EVENT = "SubmitTransaction(uint256,address,address,uint256,bytes)";
const rawdata = fs.readFileSync('../../addresses.json');
const addresses = JSON.parse(rawdata);
const IProxyRegistry = artifacts.require("./dao/test/stablecoin/IProxyRegistry.sol");
const rawdataExternal = fs.readFileSync('../../config/external-addresses.json');
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
        EMPTY_BYTES,
        _encodeBuildFunction(multiSigWallet.address),
        0,
        {gas: 8000000}
    )
    
    let txIndexBuild = eventsHelper.getIndexedEventArgs(resultBuild, SUBMIT_TRANSACTION_EVENT)[0];
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

    let proxyWalletTxn = {
        proxyWalletTxnIdx: txIndexBuild
    }
    let data2 = JSON.stringify(proxyWalletTxn);

    fs.writeFileSync('./config/newly-generated-transaction-index.json',data2, function(err){
        if(err){
            console.log(err)
        }
    })
}