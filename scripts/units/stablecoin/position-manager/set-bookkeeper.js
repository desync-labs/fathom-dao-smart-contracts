const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const BOOKKEEPER = ""
const POSITION_MANAGER_ADDRESS =addressesConfig.POSITION_MANAGER_ADDRESS

const _encodeSetBookkeeper = (_bookkeeper) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setBookKeeper',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_bookkeeper'
        }]
    }, [_bookkeeper]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetBookkeeper(BOOKKEEPER),
        POSITION_MANAGER_ADDRESS,
        "setBookeeper-Position-manager"
    )
}