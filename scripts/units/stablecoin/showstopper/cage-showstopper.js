const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const addressesConfig = require('../../../../config/config.js')

const SHOW_STOPPER_ADDRESS =addressesConfig.SHOW_STOPPER_ADDRESS

const _encodeCage = () => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'cage',
        type: 'function',
        inputs: []
    }, []);
    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeCage(),
        SHOW_STOPPER_ADDRESS,
        "cageShowStopper"
    )
}