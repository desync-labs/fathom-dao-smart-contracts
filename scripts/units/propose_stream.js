const fs = require('fs');
const txnSaver = require('./helpers/transactionSaver')
const txnHelper = require('./helpers/submitAndExecuteTransaction')
const addressesConfig = require('../../config/config.js')

const eventsHelper = require("../tests/helpers/eventsHelper");
const constants = require('./helpers/constants')
const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);
const REWARD_TOKEN_ADDRESS = addresses.fthmToken //set as needed
const STREAM_OWNER = addressesConfig.COUNCIL_1 //set as needed
const MAX_DEPOSIT_AMOUNT = web3.utils.toWei('','ether')
const MIN_DEPOSIT_AMOUNT = web3.utils.toWei('','ether')
const PERCENT_TO_TREASURY = 0

const _encodeProposeStreamFunction = (
    _owner,
    _rewardToken,
    _percentToTreasury,
    _maxDepositedAmount,
    _minDepositedAmount,
    _scheduleTimes,
    _scheduleRewards,
    _tau
) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'proposeStream',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'streamOwner'
        },{
            type: 'address',
            name: 'rewardToken'
        },
        ,{
            type: 'uint256',
            name: 'percentToTreasury'
        },{
            type: 'uint256',
            name: 'maxDepositAmount'
        },{
            type: 'uint256',
            name: 'minDepositAmount'
        },{
            type: 'uint256[]',
            name: 'scheduleTimes'
        },{
            type: 'uint256[]',
            name: 'scheduleRewards'
        },{
            type: 'uint256',
            name: 'tau'
        }]
    }, [
        _owner,
        _rewardToken,
        _percentToTreasury,
        _maxDepositedAmount,
        _minDepositedAmount,
        _scheduleTimes,
        _scheduleRewards,
        _tau
    ]);

    return toRet;
}

module.exports = async function(deployer) {
    const MULTISIG_WALLET_ADDRESS = addresses.multiSigWallet;
    const multiSigWallet = await IMultiSigWallet.at(MULTISIG_WALLET_ADDRESS);
    const startTime =  1676577600 + 500 * 24 * 60 * 60;//1676577600:ZERO_AM_UAE_TIME_SEVENTEEN_FEB_TIMESTAMP
    const oneYear = 31556926;
    const tau = 60;
    //SET AS NEEDED

    const scheduleTimes = [
        startTime,
        startTime + oneYear,
        startTime + 2 * oneYear,
        startTime + 3 * oneYear,
        startTime + 4 * oneYear,
    ];
    //SET AS NEEDED
    const scheduleRewards = [
        web3.utils.toWei('20000', 'ether'),
        web3.utils.toWei('10000', 'ether'),
        web3.utils.toWei('5000', 'ether'),
        web3.utils.toWei('2500', 'ether'),
        web3.utils.toWei("0", 'ether')
    ];


    await txnHelper.submitAndExecute(
        _encodeProposeStreamFunction(
            STREAM_OWNER,
            REWARD_TOKEN_ADDRESS,
            PERCENT_TO_TREASURY,
            MAX_DEPOSIT_AMOUNT,
            MIN_DEPOSIT_AMOUNT,
            scheduleTimes,
            scheduleRewards,
            tau
        ),
        addresses.staking,
        "proposeStreamTxn"
    )

}