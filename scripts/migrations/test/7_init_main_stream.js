const eventsHelper = require("../../tests/helpers/eventsHelper");
const constants = require("../../tests/helpers/testConstants");

const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const EMPTY_BYTES = constants.EMPTY_BYTES;
const SUBMIT_TRANSACTION_EVENT = constants.SUBMIT_TRANSACTION_EVENT
const StakingProxy = artifacts.require('./common/proxy/StakingProxy.sol')
const blockchain = require("../../tests/helpers/blockchain");
const MainToken = artifacts.require("./dao/tokens/MainToken.sol");
const LockPositionContextProxy = artifacts.require('./common/proxy/LockPositionContextProxy.sol');
const StakingGettersHelper = artifacts.require('./dao/staking/helpers/StakingGettersHelper.sol')

const _getTimeStamp = async () => {
    const timestamp = await blockchain.getLatestBlockTimestamp();
    return timestamp;
}

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

const _encodeInitMainStreamFunction = (_owner, _scheduleTimes, _scheduleRewards, tau) => {
    let toInitializeMainStream =  web3.eth.abi.encodeFunctionCall({
        name: 'initializeMainStreamAndContext',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_owner'
        },
        {
            type: 'uint256[]',
            name: 'scheduleTimes'
        },
        {
            type: 'uint256[]',
            name: 'scheduleRewards'
        },
        {
            type: 'uint256',
            name: 'tau'
        },{
            type: 'address',
            name: '_lockPositionContext'
        },{
            type: 'address',
            name: '_stakingGetter'
        }
        ]
        },  [MultiSigWallet.address, _scheduleTimes, _scheduleRewards, tau, LockPositionContextProxy.address, StakingGettersHelper.address]);

        return toInitializeMainStream
}

const tau = 2;

module.exports = async function(deployer) {

    const startTime =  await _getTimeStamp() + 3 * 24 * 60 * 60;
    const oneYear = 31556926;
    const scheduleTimes = [
        startTime,
        startTime + oneYear,
        startTime + 2 * oneYear,
        startTime + 3 * oneYear,
        startTime + 4 * oneYear,
    ];

    const scheduleRewards = [
        web3.utils.toWei('20000', 'ether'),
        web3.utils.toWei('10000', 'ether'),
        web3.utils.toWei('5000', 'ether'),
        web3.utils.toWei('2500', 'ether'),
        web3.utils.toWei("0", 'ether')
    ];
    
    
    const multiSigWallet = await IMultiSigWallet.at(MultiSigWallet.address)

    let resultApprove = await multiSigWallet.submitTransaction(
        MainToken.address,
        EMPTY_BYTES,
        _encodeApproveFunction(StakingProxy.address,scheduleRewards[0]),
        0,
        {gas: 8000000}
    )

    let txIndexApprove = eventsHelper.getIndexedEventArgs(resultApprove, SUBMIT_TRANSACTION_EVENT)[0];
    await multiSigWallet.confirmTransaction(txIndexApprove, {gas: 8000000});
    await multiSigWallet.executeTransaction(txIndexApprove, {gas: 8000000});

    let resultInit = await multiSigWallet.submitTransaction(
        StakingProxy.address, 
        EMPTY_BYTES, 
        _encodeInitMainStreamFunction(MultiSigWallet.address,scheduleTimes, scheduleRewards,tau),
        0,
        {gas: 8000000}
    );

    let txIndexInit = eventsHelper.getIndexedEventArgs(resultInit, SUBMIT_TRANSACTION_EVENT)[0];
    await multiSigWallet.confirmTransaction(txIndexInit, {gas: 8000000});
    await multiSigWallet.executeTransaction(txIndexInit, {gas: 8000000});
}
