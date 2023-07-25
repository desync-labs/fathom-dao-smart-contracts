const fs = require('fs');
const constants = require('./helpers/constants') 


const txnHelper = require('./helpers/submitAndExecuteTransaction')

//RIGHT NOW SETUP FOR STAKING
const PROXY_ADMIN = "0xB7a8f3A8178B21499b56d9d054119821953d2C3f"//SET AS NECESSARY
const newOwner = ""//SET AS NECESSARY
const _encodeTransferOwnership = (newOwner) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'transferOwnership',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'newOwner'
        }]
    }, [newOwner]);

    return toRet;
}


module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeTransferOwnership(
            newOwner
        ),
        PROXY_ADMIN,
        "transferOwnership"
    )
}