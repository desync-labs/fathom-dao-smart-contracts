const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);

const ORACLE = ""
const DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS =addressesExternal.DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS

const _encodeSetOracle = (_oracle) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setOracle',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_oracle'
        }]
    }, [_oracle]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetOracle(ORACLE),
        DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS,
        "setOracle"
    )
}