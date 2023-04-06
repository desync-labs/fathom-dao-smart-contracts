const fs = require('fs');

const txnHelper = require('./helpers/submitAndExecuteTransaction')
const constants = require('./helpers/constants')


const addressesConfig = require('../../config/config.js')
const STABLE_SWAP_ADDRESS = addressesConfig.STABLE_SWAP_ADDRESS
//const STABLE_SWAP_ADDRESS = "" //SET
const DAILY_LIMIT = web3.utils.toWei('100000','ether') //SET


const _encodeUpdateDailySwapLimit = (newdailySwapLimit) =>{
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setDailySwapLimit',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: 'newdailySwapLimit'
        }]
    }, [newdailySwapLimit]);

    return toRet;
}

module.exports = async function(deployer)  {
    await txnHelper.submitAndExecute(
        _encodeUpdateDailySwapLimit(
            DAILY_LIMIT
        ),
        STABLE_SWAP_ADDRESS,
        "stableSwapDailyLimitUpdate"
    )
}