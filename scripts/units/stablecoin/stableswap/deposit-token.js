
const constants = require('../../helpers/constants')
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const STABLE_SWAP_ADDRESS = addressesConfig.STABLE_SWAP_ADDRESS
const TokenAddress = addressesConfig.USD_ADDRESS
//const STABLE_SWAP_ADDRESS = "";
const TokenDepositAmount = web3.utils.toWei('10000','ether')
// const USDAddress = ""
// const FXDAddress = ""
const _encodeApproveFunction = (_account, _amount) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'approve',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'spender'
        },{
            type: 'uint256',
            name: 'amount'
        }]
    }, [_account, _amount]);

    return toRet;
}

const _encodeDepositFunction = (_token, _amount) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'depositToken',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_token'
        },{
            type: 'uint256',
            name: '_amount'
        }]
    }, [_token, _amount]);

    return toRet;
}

module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeApproveFunction(STABLE_SWAP_ADDRESS,TokenDepositAmount),
        TokenAddress,
        "ApproveStableSwapToken"
    )

    await txnHelper.submitAndExecute(
        _encodeDepositFunction(TokenAddress,TokenDepositAmount),
        STABLE_SWAP_ADDRESS,
        "DepositToStableswap"
    )
}
