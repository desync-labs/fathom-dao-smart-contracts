//NOTE: This script can be run only once for each deployment as making COUNCIL_STAKES is only possible once
const fs = require('fs');

const eventsHelper = require("../tests/helpers/eventsHelper");

const IStaking = artifacts.require('./dao/staking/interfaces/IStaking.sol');

const MainToken = artifacts.require("./dao/tokens/MainToken.sol");

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");

const EMPTY_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000';
const SUBMIT_TRANSACTION_EVENT = "SubmitTransaction(uint256,address,address,uint256,bytes)";

const LOCK_PERIOD = 365 * 24 * 60 * 60;
//SET AS NEEDED
// this needs to be sum of all the stakes. Right now 10KK * 3.
const T_TOTAL_TO_APPROVE = web3.utils.toWei('30000000', 'ether');
// this is how much to stake for one council . Right now 10KK
const T_TO_STAKE = web3.utils.toWei('10000000', 'ether');

const COUNCIL_1 = "0xc0Ee98ac1a44B56fbe2669A3B3C006DEB6fDd0f9";
const COUNCIL_2 = "0x01d2D3da7a42F64e7Dc6Ae405F169836556adC86";
const COUNCIL_3 = "0x4C5F0f90a2D4b518aFba11E22AC9b8F6B031d204";

const rawdata = fs.readFileSync('../../addresses.json');
const addresses = JSON.parse(rawdata);

const _createLockParamObject = (
    _amount,
    _lockPeriod,
    _account) => {
    return {
        amount: _amount,
        lockPeriod: _lockPeriod,
        account: _account
    }
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

const _encodeCreateLocksForCouncils = (_createLockParam) => {
    let toRet = web3.eth.abi.encodeFunctionCall({
        name:'createLocksForCouncils',
        type:'function',
        inputs: [{
                type: 'tuple[]',
                name: 'CreateLockParams',
                components: [
                    {"type":"uint256", "name":"amount"},
                    {"type":"uint256", "name":"lockPeriod"},
                    {"type":"address", "name":"account"}
                ]
            }
        ]
    },[_createLockParam])
    return toRet
}

module.exports = async function(deployer) {
    const stakingService = await IStaking.at(addresses.staking);
    const multiSigWallet = await IMultiSigWallet.at(addresses.multiSigWallet);

    let resultApprove = await multiSigWallet.submitTransaction(
        MainToken.address,
        EMPTY_BYTES,
        _encodeApproveFunction(stakingService.address,T_TOTAL_TO_APPROVE),
        0,
        {gas: 8000000}
    )
    
    let txIndexApprove = eventsHelper.getIndexedEventArgs(resultApprove, SUBMIT_TRANSACTION_EVENT)[0];
    await multiSigWallet.confirmTransaction(txIndexApprove, {gas: 8000000});
    await multiSigWallet.executeTransaction(txIndexApprove, {gas: 8000000});
    console.log("....Tokens Approved");
    const LockParamObjectForAllCouncils = [
        _createLockParamObject(T_TO_STAKE,LOCK_PERIOD,COUNCIL_3),
        _createLockParamObject(T_TO_STAKE,LOCK_PERIOD,COUNCIL_1),
        _createLockParamObject(T_TO_STAKE,LOCK_PERIOD,COUNCIL_2)
    ]

    let resultCreateLock = await multiSigWallet.submitTransaction(
        stakingService.address,
        EMPTY_BYTES,
        _encodeCreateLocksForCouncils(LockParamObjectForAllCouncils),
        0,
        {gas: 8000000}
    )

    
    let txIndexCreateLock = eventsHelper.getIndexedEventArgs(resultCreateLock, SUBMIT_TRANSACTION_EVENT)[0];
    await multiSigWallet.confirmTransaction(txIndexCreateLock, {gas: 8000000});
    await multiSigWallet.executeTransaction(txIndexCreateLock, {gas: 8000000});
    console.log("....Council Lock Positions Created");
}