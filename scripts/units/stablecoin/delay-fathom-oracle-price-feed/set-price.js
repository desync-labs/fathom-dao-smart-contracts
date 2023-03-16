const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);

const DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS =addressesExternal.DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS

const _encodeSetPrice = () => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setPrice',
        type: 'function',
        inputs: []
    }, []);
    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetPrice(),
        DELAY_FATHOM_ORACLE_PRICE_FEED_ADDRESS,
        "setPriceDelayFathomOracle"
    )
}