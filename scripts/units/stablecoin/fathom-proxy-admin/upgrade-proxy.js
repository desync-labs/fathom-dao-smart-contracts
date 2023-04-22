const fs = require('fs');


const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const FATHOM_PROXY_ADMIN = "0xB7a8f3A8178B21499b56d9d054119821953d2C3f"
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
        FATHOM_PROXY_ADMIN,
        "upgradeStablecoinProxy"
    )
}