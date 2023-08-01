const fs = require('fs');

const constants = require('./helpers/constants')
const T_TO_TRANSFER_PLACEHOLDER = web3.utils.toWei('1000000','ether') //SET AS NEEDED
const TRANSFER_TO_ACCOUNT_PLACEHOLDER = "0x0Eb7DEE6e18Cce8fE839E986502d95d47dC0ADa3" //SET AS NEEDED
const txnHelper = require('./helpers/submitAndExecuteTransaction')
const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);
const _encodeTransferFunction = (_account, t_to_stake) => {

    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'transfer',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'to'
        },{
            type: 'uint256',
            name: 'amount'
        }]
    }, [_account, t_to_stake]);

    return toRet;
}

module.exports = async function(deployer) {
    const FATHOM_TOKEN_ADDRESS  = addresses.fthmToken;
    
    await txnHelper.submitAndExecute(
        _encodeTransferFunction(TRANSFER_TO_ACCOUNT_PLACEHOLDER, T_TO_TRANSFER_PLACEHOLDER),
        FATHOM_TOKEN_ADDRESS,
        "transferFathomTokenFromMultisig"
    )
}