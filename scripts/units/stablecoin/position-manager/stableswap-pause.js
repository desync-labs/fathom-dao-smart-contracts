const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);

const POSITION_MANAGER_ADDRESS =addressesExternal.POSITION_MANAGER_ADDRESS

const _encodePause = () => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'pause',
        type: 'function',
        inputs: []
    }, []);
    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodePause(),
        POSITION_MANAGER_ADDRESS,
        "pausePositionManager"
    )
}