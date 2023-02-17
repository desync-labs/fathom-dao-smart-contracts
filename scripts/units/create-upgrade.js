const fs = require('fs');

const eventsHelper = require("../tests/helpers/eventsHelper");


const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");

const EMPTY_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000';
const SUBMIT_TRANSACTION_EVENT = "SubmitTransaction(uint256,address,address,uint256,bytes)";
const rawdata = fs.readFileSync('../../addresses.json');
const addresses = JSON.parse(rawdata);
const PROXY_ADMIN = ""
const PROXY = ""
const IMPLEMENTATION_ADDRESS = ""
const _encodeUpgradeFunction = (_proxy, _impl) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'upgrade',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'proxy'
        },{
            type: 'address',
            name: 'implementation'
        }]
    }, [_proxy, _impl]);

    return toRet;
}


module.exports = async function(deployer) {
    const MULTISIG_WALLET_ADDRESS = addresses.multiSigWallet;
    const multiSigWallet = await IMultiSigWallet.at(MULTISIG_WALLET_ADDRESS);

    const _upgrade = async(
        _proxy,
        _impl
    ) => {
        const result = await multiSigWallet.submitTransaction(
            PROXY_ADMIN,
            EMPTY_BYTES,
            _encodeUpgradeFunction(
                _proxy,
                _impl
            )
        )
        const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
        await multiSigWallet.confirmTransaction(tx, {gas: 8000000});
        await multiSigWallet.executeTransaction(tx, {gas: 8000000});
    }

    await _upgrade(
        PROXY,
        IMPLEMENTATION_ADDRESS
    )
}