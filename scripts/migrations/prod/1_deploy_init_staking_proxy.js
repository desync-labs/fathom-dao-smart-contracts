const RewardsCalculator = artifacts.require('./dao/staking/packages/RewardsCalculator.sol');

const blockchain = require("../../tests/helpers/blockchain");
const VMainToken = artifacts.require('./dao/tokens/VMainToken.sol');

const IStaking = artifacts.require('./dao/staking/interfaces/IStaking.sol');
const StakingPackage = artifacts.require('./dao/staking/packages/StakingPackage.sol');

const MainToken = artifacts.require("./dao/tokens/MainToken.sol");

const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
const IVault = artifacts.require('./dao/staking/vault/interfaces/IVault.sol');
const StakingProxyAdmin = artifacts.require('./common/proxy/StakingProxyAdmin.sol');
const StakingProxy = artifacts.require('./common/proxy/StakingProxy.sol')
const VaultProxy = artifacts.require('./common/proxy/VaultProxy.sol')

const _createWeightObject = (
    maxWeightShares,
    minWeightShares,
    maxWeightPenalty,
    minWeightPenalty,
    weightMultiplier) => {
    return {
        maxWeightShares: maxWeightShares,
        minWeightShares: minWeightShares,
        maxWeightPenalty: maxWeightPenalty,
        minWeightPenalty: minWeightPenalty,
        penaltyWeightMultiplier: weightMultiplier
    }
}

const _createVoteWeights = (
    voteShareCoef,
    voteLockCoef) => {
    return {
        voteShareCoef: voteShareCoef,
        voteLockCoef: voteLockCoef
    }
}

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

    const vMainTokenCoefficient = 500;

const oneYear = 31556926;

const maxWeightShares = 1024;
const minWeightShares = 768;
const maxWeightPenalty = 3000;
const minWeightPenalty = 100;
const weightMultiplier = 10;
const maxNumberOfLocks = 10;
const maxOnBehalfLockPositions = 5;
const tau = 2;

const lockingVoteWeight = 365 * 24 * 60 * 60;

module.exports = async function(deployer) {
    try{
        const vaultService = await IVault.at(VaultProxy.address)

        const weightObject =  _createWeightObject(
            maxWeightShares,
            minWeightShares,
            maxWeightPenalty,
            minWeightPenalty,
            weightMultiplier
        );
        
        
        const startTime =  await _getTimeStamp() + 3 * 24 * 60 * 60;

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

        const voteObject = _createVoteWeights(
            vMainTokenCoefficient,
            lockingVoteWeight
        );


        let toInitialize =  web3.eth.abi.encodeFunctionCall({
            name: 'initializeStaking',
            type: 'function',
            inputs: [{
                type: 'address',
                name: '_admin'
            },
            {
                type: 'address',
                name: '_vault'
            },
            {
                type: 'address',
                name: '_mainToken'
            },
            {
                type: 'address',
                name: '_voteToken'
            },
            {
                type: 'tuple',
                name: 'Weight',
                components: [
                    {"type": "uint32", "name":"maxWeightShares"},
                    {"type": "uint32", "name":"minWeightShares"},
                    {"type": "uint32", "name":"maxWeightPenalty"},
                    {"type": "uint32", "name":"minWeightPenalty"},
                    {"type": "uint32", "name":"penaltyWeightMultiplier"}
                ]
            },
            {
                type: 'tuple',
                name: 'VoteCoefficient',
                components: [
                    {"type": "uint32", "name":"voteShareCoef"},
                    {"type": "uint32", "name":"voteLockCoef"}
                ]
            },
            {
                type: 'uint256',
                name: '_maxLocks'
            },
            {
                type: 'address',
                name: '_rewardsContract'
            },
            {
                type: 'uint256',
                name: '_maxOnBehalfLockPositions'
            }]
            },  [MultiSigWallet.address, vaultService.address, MainToken.address, VMainToken.address, 
                weightObject, voteObject, maxNumberOfLocks, RewardsCalculator.address,maxOnBehalfLockPositions]);
        
        await deployer.deploy(StakingProxyAdmin, {gas:8000000});
        await deployer.deploy(StakingProxy, StakingPackage.address, StakingProxyAdmin.address, toInitialize, {gas:8000000});
    } catch(error) {
        console.log(error)
    }
}