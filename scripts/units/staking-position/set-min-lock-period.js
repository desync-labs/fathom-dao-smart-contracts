const fs = require('fs');
const constants = require('../helpers/constants')
const txnHelper = require('../helpers/submitAndExecuteTransaction')

const env = process.env.NODE_ENV || 'demo';
const addressesFilePath = `../../../addresses.${env}.json`;
const rawdata = fs.readFileSync(addressesFilePath);
const addresses = JSON.parse(rawdata);

const MIN_LOCK_PERIOD_NEW = 120
const STAKING_CONTRACT = addresses.staking

const _encodeSetMinLockPeriod = (_minLockPeriod) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setMinimumLockPeriod',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: '_minLockPeriod'
        }]
    }, [_minLockPeriod]);

    return toRet;
}

module.exports = async function(deployer) {
    console.log(_encodeSetMinLockPeriod(MIN_LOCK_PERIOD_NEW))
    // await txnHelper.submitAndExecute(
    //     _encodeSetMinLockPeriod(MIN_LOCK_PERIOD_NEW),
    //     STAKING_CONTRACT,
    //     "Set min lock period to 60 seconds"
    // )
}