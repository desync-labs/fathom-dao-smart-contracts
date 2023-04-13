const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const addressesConfig = require('../../../../config/config.js')

const STABILITY_FEE_COLLECTOR_ADDRESS =addressesConfig.STABILITY_FEE_COLLECTOR_ADDRESS

const _encodePause = () => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'pause',
        type: 'function',
        inputs: []
    }, []);
    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodePause(),
        STABILITY_FEE_COLLECTOR_ADDRESS,
        "pauseStabilityFeeCollector"
    )
}