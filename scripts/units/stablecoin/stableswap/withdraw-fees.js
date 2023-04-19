const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const env = process.env.NODE_ENV || 'dev';
const addressesConfig = require(`../../../../config/config.${env}`)

const _destination = ""
const STABLE_SWAP_ADDRESS =addressesConfig.STABLE_SWAP_ADDRESS

const _encodeWithdrawFees = (_destination) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'withdrawFees',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_destination'
        }]
    }, [_destination]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeWithdrawFees(_destination),
        STABLE_SWAP_ADDRESS,
        "StableswapWithdrawFees"
    )
}