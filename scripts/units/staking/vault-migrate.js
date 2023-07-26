const fs = require('fs');
const txnHelper = require('../helpers/submitAndExecuteTransaction')

const constants = require('../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_DEX_FOLDER)
const FEE_TO_SETTER = ""
const VAULT_ADDRESS = addressesConfig.VAULT_ADDRESS
const WITHDRAW_TO = ""
const NEW_VAULT_PACKAGE = ""
const _encodeMigrate = (newVaultPackage) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'migrate',
        type: 'function',
        inputs: [
            {
                type: 'address',
                name: 'newVaultPackage'
            }]
    }, [newVaultPackage]);

    return toRet;
}


module.exports = async function(deployer) {
    
    await txnHelper.submitAndExecute(
        _encodeMigrate(NEW_VAULT_PACKAGE),
        VAULT_ADDRESS,
        "migrate-vault-package"
    )
}