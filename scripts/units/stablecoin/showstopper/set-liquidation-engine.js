const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const LIQUIDATION_ENGINE_ADDRESS = ""
const SHOW_STOPPER_ADDRESS =addressesConfig.SHOW_STOPPER_ADDRESS
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