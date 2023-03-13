const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);

const ACCOUNT_DESTINATION = ""
const STABLE_SWAP_ADDRESS =addressesExternal.STABLE_SWAP_ADDRESS

const _encodeEmergencyWithdraw = (_destination) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'emergencyWithdraw',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_account'
        }]
    }, [_destination]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeEmergencyWithdraw(ACCOUNT_DESTINATION),
        STABLE_SWAP_ADDRESS,
        "StableswapEmergencyWithdraw"
    )
}