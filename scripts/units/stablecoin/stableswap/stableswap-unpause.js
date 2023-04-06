const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const addressesConfig = require('../../../../config/config.js')

const STABLE_SWAP_ADDRESS =addressesConfig.STABLE_SWAP_ADDRESS

const _encodeUnpause = () => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'unpause',
        type: 'function',
        inputs: []
    }, []);
    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeUnpause(),
        STABLE_SWAP_ADDRESS,
        "unpauseStableSwap"
    )
}