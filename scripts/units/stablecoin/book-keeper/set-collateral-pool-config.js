const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const BOOK_KEEPER_ADDRESS =addressesConfig.BOOK_KEEPER_ADDRESS
const CollateralPoolConfig = ""
const _encodeSetCollateralPoolConfig = (_collateralPoolConfig) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setCollateralPoolConfig',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_collateralPoolConfig'
        }]
    }, [_collateralPoolConfig]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetCollateralPoolConfig(CollateralPoolConfig),
        BOOK_KEEPER_ADDRESS,
        "setCollateralPoolConfig"
    )
}