const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);

const PRICE_ORACLE_ADDRESS =addressesExternal.PRICE_ORACLE_ADDRESS
const DATA = 123
const _encodeSetStableCoinReferencePrice = (_data) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setStableCoinReferencePrice',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: '_data'
        }]
    }, [_data]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetStableCoinReferencePrice(DATA),
        PRICE_ORACLE_ADDRESS,
        "setStablecoinReferencePrice"
    )
}