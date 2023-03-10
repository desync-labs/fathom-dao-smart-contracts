const fs = require('fs');
const constants = require('./helpers/constants') 
const txnHelper = require('./helpers/transactionSaver')

const eventsHelper = require("../tests/helpers/eventsHelper");


const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);
//RIGHT NOW SETUP FOR STAKING
const PROXY_ADMIN = "0xB7a8f3A8178B21499b56d9d054119821953d2C3f"
const PROXY = "0xFD21E72b63568942E541284D275ce1057e7F1257"
const IMPLEMENTATION_ADDRESS = "0xa5B675dd61c00C41F3FA5b919b7E917A61dbE7f7"
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
            constants.EMPTY_BYTES,
            _encodeUpgradeFunction(
                _proxy,
                _impl
            ),0,{gas:8000000}
        )
        const tx = eventsHelper.getIndexedEventArgs(result, constants.SUBMIT_TRANSACTION_EVENT)[0];
        await multiSigWallet.confirmTransaction(tx, {gas: 8000000});
        await multiSigWallet.executeTransaction(tx, {gas: 8000000});
        await txnHelper.saveTxnIndex("upgradeTxn",tx)
    }

    await _upgrade(
        PROXY,
        IMPLEMENTATION_ADDRESS
    )
}