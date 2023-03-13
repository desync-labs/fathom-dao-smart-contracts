const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);

const SYSTEM_DEBT_ENGINE_ADDRESS =addressesExternal.SYSTEM_DEBT_ENGINE_ADDRESS

const _encodeUnause = () => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'unpause',
        type: 'function',
        inputs: []
    }, []);
    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeUnause(),
        SYSTEM_DEBT_ENGINE_ADDRESS,
        "unpauseSystemDebtEngine"
    )
}