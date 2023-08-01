const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const PROXY_WALLET_REGISTRY_ADDRESS =addressesConfig.PROXY_WALLET_REGISTRY_ADDRESS
const isOn = true
const _encodeSetIsDecentralizedState = (isOn) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setDecentralizedMode',
        type: 'function',
        inputs: [{
            type: 'bool',
            name: 'isOn'
        }]
    }, [isOn]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetIsDecentralizedState(isOn),
        PROXY_WALLET_REGISTRY_ADDRESS,
        "set-decentralized-mode"
    )
}