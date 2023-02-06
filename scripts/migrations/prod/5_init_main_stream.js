const eventsHelper = require("../../tests/helpers/eventsHelper");

const MainToken = artifacts.require("./dao/tokens/MainToken.sol");

const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const EMPTY_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000';
const SUBMIT_TRANSACTION_EVENT = "SubmitTransaction(uint256,address,address,uint256,bytes)";

const StakingProxy = artifacts.require('./common/proxy/StakingProxy.sol')

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
        name: 'initializeMainStream',
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
        }]
        },  [MultiSigWallet.address, _scheduleTimes, _scheduleRewards, tau]);

        return toInitializeMainStream
}

const tau = 2;

module.exports = async function(deployer) {
    const startTime =  1675526400 //EIGHT_PM_UAE_TIME_FEB_FOUR_Timestamp
    const oneDay = 86400;
    const scheduleTimes = [
        startTime,
        startTime + 1 * oneDay,
        startTime + 2 * oneDay,
        startTime + 3 * oneDay,
        startTime + 4 * oneDay,
        startTime + 5 * oneDay,
        startTime + 6 * oneDay,
        startTime + 7 * oneDay,
        startTime + 8 * oneDay,
        startTime + 9 * oneDay,
        startTime + 10 * oneDay
    ];

    const scheduleRewards = [
        web3.utils.toWei('150000000', 'ether'),
        web3.utils.toWei('135000000', 'ether'),
        web3.utils.toWei('120000000', 'ether'),
        web3.utils.toWei('105000000', 'ether'),
        web3.utils.toWei('90000000', 'ether'),
        web3.utils.toWei('75000000', 'ether'),
        web3.utils.toWei('60000000', 'ether'),
        web3.utils.toWei('45000000', 'ether'),
        web3.utils.toWei('30000000', 'ether'),
        web3.utils.toWei('15000000', 'ether'),
        web3.utils.toWei('0', 'ether')
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
    const resultOfInitMainStream = await multiSigWallet.executeTransaction(txIndexInit, {gas: 8000000});
    //const successStatusInitMainStream = eventsHelper.getIndexedEventArgs(resultOfInitMainStream, ExecuteTransactionSuccess);
}
