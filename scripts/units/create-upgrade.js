const fs = require('fs');
const constants = require('./helpers/constants') 
const txnSaver = require('./helpers/transactionSaver')

const eventsHelper = require("../tests/helpers/eventsHelper");

const txnHelper = require('./helpers/submitAndExecuteTransaction')

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
    await txnHelper.submitAndExecute(
        _encodeUpgradeFunction(
            PROXY,
            IMPLEMENTATION_ADDRESS
        ),
        PROXY_ADMIN,
        "upgradeTxn"
    )
}