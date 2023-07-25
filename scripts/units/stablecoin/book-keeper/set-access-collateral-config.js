const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const BOOK_KEEPER_ADDRESS =addressesConfig.BOOK_KEEPER_ADDRESS
const AccessControlConfig = ""
const _encodeSetAccessControlConfig = (_accessControlConfig) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setAccessControlConfig',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_accessControlConfig'
        }]
    }, [_accessControlConfig]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetAccessControlConfig(AccessControlConfig),
        BOOK_KEEPER_ADDRESS,
        "setAccessControlConfig"
    )
}
