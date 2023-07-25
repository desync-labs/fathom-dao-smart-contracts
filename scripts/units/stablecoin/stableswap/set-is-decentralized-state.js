const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)
const isDecentralizedState = true
const STABLE_SWAP_ADDRESS = addressesConfig.STABLE_SWAP_ADDRESS

const _encodeSetIsDecentralizedState = (_isDecentralizedState) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setIsDecentralizedState',
        type: 'function',
        inputs: [{
            type: 'bool',
            name: '_isDecentralizedState'
        }]
    }, [_isDecentralizedState]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeSetIsDecentralizedState(isDecentralizedState),
        STABLE_SWAP_ADDRESS,
        "set Is Decentralized State"
    )
}