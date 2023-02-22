const fs = require('fs');

const eventsHelper = require("../tests/helpers/eventsHelper");

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const EMPTY_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000';
const SUBMIT_TRANSACTION_EVENT = "SubmitTransaction(uint256,address,address,uint256,bytes)";
const rawdata = fs.readFileSync('../../addresses.json');
const addresses = JSON.parse(rawdata);
const REWARD_TOKEN_ADDRESS = ""
const STREAM_OWNER = ""
const MAX_DEPOSIT_AMOUNT = web3.utils.toWei('','ether')
const MIN_DEPOSIT_AMOUNT = web3.utils.toWei('','ether')


const _encodeProposeStreamFunction = (
    _owner,
    _rewardToken,
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

    const _proposeStreamFromMultiSig = async(_owner,
        _rewardToken,
        _maxDepositedAmount,
        _minDepositedAmount,
        _scheduleTimes,
        _scheduleRewards,
        _tau
        ) => 
    {
        const result = await multiSigWallet.submitTransaction(
            addresses.staking,
            EMPTY_BYTES,
            _encodeProposeStreamFunction(
                _owner,
                _rewardToken,
                _maxDepositedAmount,
                _minDepositedAmount,
                _scheduleTimes,
                _scheduleRewards,
                _tau
            ),
            0,
            {gas: 8000000}
        )

        const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
        await multiSigWallet.confirmTransaction(tx, {gas: 8000000});
        await multiSigWallet.executeTransaction(tx, {gas: 8000000});
    }

    await _proposeStreamFromMultiSig(
        STREAM_OWNER,
        REWARD_TOKEN_ADDRESS,
        MAX_DEPOSIT_AMOUNT,
        MIN_DEPOSIT_AMOUNT,
        scheduleTimes,
        scheduleRewards,
        tau
    )
}