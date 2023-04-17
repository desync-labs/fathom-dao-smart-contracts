const fs = require('fs');
const constants = require('./helpers/constants') 
const txnHelper = require('./helpers/submitAndExecuteTransaction')


const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);
const STREAM_REWARD_TOKEN_ADDRESS = addresses.fthmToken //FTHM address //SET AS NECESSARY
const REWARD_PROPOSAL_AMOUNT = web3.utils.toWei('','ether')
const STREAM_ID = 1//SET
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

const _encodeCreateStreamFunction = (
    _streamId, _rewardTokenAmount
) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'createStream',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: 'streamId'
        },{
            type: 'uint256',
            name: 'rewardTokenAmount'
        }]
    }, [_streamId, _rewardTokenAmount]);

    return toRet;
}

module.exports = async function(deployer) {
    
    await txnHelper.submitAndExecute(
        _encodeApproveFunction(
            addresses.staking,
            REWARD_PROPOSAL_AMOUNT
        ),
        STREAM_REWARD_TOKEN_ADDRESS,
        "approveStreamRewardsTxn"
    )

    await txnHelper.submitAndExecute(
        _encodeCreateStreamFunction(
            STREAM_ID,
            REWARD_PROPOSAL_AMOUNT),
            addresses.staking,
        "createStreamRewardsTxn"
    )


}

