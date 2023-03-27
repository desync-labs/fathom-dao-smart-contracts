const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);
const TO = "0x"
const VALUE = 123
const SYSTEM_DEBT_ENGINE_ADDRESS =addressesExternal.SYSTEM_DEBT_ENGINE_ADDRESS

const _encodeWithdrawStablecoinSurplus = (_to,_value) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'withdrawStablecoinSurplus',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_to'
        },
        {
            type: 'uint256',
            name: '_value'
        }]
    }, [_to,_value]);

    return toRet;
}

module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeWithdrawStablecoinSurplus(TO,VALUE),
        SYSTEM_DEBT_ENGINE_ADDRESS,
        "WithdrawStablecoinSurplus"
    )
}