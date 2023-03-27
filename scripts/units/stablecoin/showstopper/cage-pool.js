const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);

const COLLATERAL_POOL_ID = ''
const SHOW_STOPPER_ADDRESS =addressesExternal.SHOW_STOPPER_ADDRESS

const _encodeCagePool = (_collateralPoolId) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'cagePool',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_collateralPoolId'
        }]
    }, [_collateralPoolId]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeCagePool(COLLATERAL_POOL_ID),
        SHOW_STOPPER_ADDRESS,
        "cageCollateralPool"
    )
}