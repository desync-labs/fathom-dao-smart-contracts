const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);

const TOKEN_ZERO = ""
const DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS =addressesExternal.DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS

const _encodeSetToken0 = (_token) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setToken0',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_token'
        }]
    }, [_token]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetToken0(TOKEN_ZERO),
        DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS,
        "setToken0"
    )
}