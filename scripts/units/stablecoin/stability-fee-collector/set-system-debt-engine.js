const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);

const SYSTEM_DEBT_ENGINE_ADDRESS = ""
const STABILITY_FEE_COLLECTOR_ADDRESS =addressesExternal.STABILITY_FEE_COLLECTOR_ADDRESS

const _encodeSetBookKeeper = (_systemDebtEngine) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setSystemDebtEngine',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_systemDebtEngine'
        }]
    }, [_systemDebtEngine]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetBookKeeper(SYSTEM_DEBT_ENGINE_ADDRESS),
        STABILITY_FEE_COLLECTOR_ADDRESS,
        "setStabilityFeeCollector"
    )
}