const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);

const LIQUIDATION_ENGINE_ADDRESS = ""
const SHOW_STOPPER_ADDRESS =addressesExternal.SHOW_STOPPER_ADDRESS
const _encodeLiquidationEngine = (_liquidationEngine) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setLiquidationEngine',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_liquidationEngine'
        }]
    }, [_liquidationEngine]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeLiquidationEngine(LIQUIDATION_ENGINE_ADDRESS),
        SHOW_STOPPER_ADDRESS,
        "setLiquidationEngine"
    )
}