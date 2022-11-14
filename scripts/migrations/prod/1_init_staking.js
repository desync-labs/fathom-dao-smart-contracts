const blockchain = require("../../tests/helpers/blockchain");

const VMainToken = artifacts.require('./dao/tokens/VMainToken.sol');

const IStaking = artifacts.require('./dao/staking/interfaces/IStaking.sol');
const StakingPackage = artifacts.require('./dao/staking/packages/StakingPackage.sol');

const MainToken = artifacts.require("./dao/tokens/MainToken.sol");

const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");

const Vault = artifacts.require('./dao/staking/vault/packages/VaultPackage.sol');

const RewardsCalculator = artifacts.require('./dao/staking/packages/RewardsCalculator.sol');

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

const vMainTokenCoefficient = 500;

const oneYear = 31556926;

const maxWeightShares = 1024;
const minWeightShares = 256;
const maxWeightPenalty = 3000;
const minWeightPenalty = 100;
const weightMultiplier = 10;
const maxNumberOfLocks = 10;

const tau = 2;

const lockingVoteWeight = 365 * 24 * 60 * 60;

module.exports = async function(deployer) {
    const stakingService = await IStaking.at(StakingPackage.address);

    const weightObject =  _createWeightObject(
        maxWeightShares,
        minWeightShares,
        maxWeightPenalty,
        minWeightPenalty,
        weightMultiplier
    );

    const startTime =  await _getTimeStamp() + 3 * 24 * 24 * 60;

    const scheduleTimes = [
        startTime,
        startTime + oneYear,
        startTime + 2 * oneYear,
        startTime + 3 * oneYear,
        startTime + 4 * oneYear,
    ];

    const scheduleRewards = [
        web3.utils.toWei('2000', 'ether'),
        web3.utils.toWei('1000', 'ether'),
        web3.utils.toWei('500', 'ether'),
        web3.utils.toWei('250', 'ether'),
        web3.utils.toWei("0", 'ether')
    ];

    const voteObject = _createVoteWeights(
        vMainTokenCoefficient,
        lockingVoteWeight
    );

    await stakingService.initializeStaking(
        MultiSigWallet.address,
        Vault.address,
        MainToken.address,
        VMainToken.address,
        weightObject,
        scheduleTimes,
        scheduleRewards,
        tau,
        voteObject,
        maxNumberOfLocks,
        RewardsCalculator.address,
        {gas: 8000000}
    );

    
}