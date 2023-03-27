const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);

const CAGE_COOL_DOWN =1 
const SHOW_STOPPER_ADDRESS =addressesExternal.SHOW_STOPPER_ADDRESS

const _encodeSetCageCooldown = (_cageCoolDown) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setCageCoolDown',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: '_cageCoolDown'
        }]
    }, [_cageCoolDown]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeSetCageCooldown(CAGE_COOL_DOWN),
        SHOW_STOPPER_ADDRESS,
        "setCageCooldown"
    )
}