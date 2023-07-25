const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS =addressesConfig.DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS

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
        DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS,
        "pausePriceFeed"
    )
}

//TODO:
//PRICE PLUGIN, FEED