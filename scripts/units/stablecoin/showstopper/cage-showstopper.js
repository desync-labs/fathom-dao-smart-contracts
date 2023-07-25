const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const SHOW_STOPPER_ADDRESS = addressesConfig.SHOW_STOPPER_ADDRESS

const CAGE_COOL_DOWN = 100;
const _encodeCage = (_cageCoolDown) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'cage',
        type: '_cageCoolDown',
        inputs: [_cageCoolDown]
    }, [_cageCoolDown]);
    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeCage(CAGE_COOL_DOWN),
        SHOW_STOPPER_ADDRESS,
        "cageShowStopper"
    )
}


//function cage(uint256 _cageCoolDown) external onlyOwner {
