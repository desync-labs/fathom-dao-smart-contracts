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

const vMainTokenCoefficient = 500;

const oneYear = 31556926;
const oneDay = 86400;

const maxWeightShares = 1024;
const minWeightShares = 768;
const maxWeightPenalty = 3000;
const minWeightPenalty = 100;
const weightMultiplier = 10;
const maxNumberOfLocks = 10;

const tau = 60;

const lockingVoteWeight = 31556926;

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
        
       // const thirteenDecemberTimestampMidNight = 1670889600
        const EightThirtyPMUAETimestampTwelveDec = 1670862600;

        const startTime =  EightThirtyPMUAETimestampTwelveDec;

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
            startTime + 10 * oneDay,
            startTime + 11 * oneDay,
            startTime + 12 * oneDay,
            startTime + 13 * oneDay,
            startTime + 14 * oneDay,
            startTime + 15 * oneDay,
            startTime + 16 * oneDay,
            startTime + 17 * oneDay,
            startTime + 18 * oneDay,
            startTime + 19 * oneDay,
            startTime + 20 * oneDay,
            startTime + 21 * oneDay,
            startTime + 22 * oneDay,
            startTime + 23 * oneDay,
            startTime + 24 * oneDay,
            startTime + 25 * oneDay,
            startTime + 26 * oneDay,
            startTime + 27 * oneDay,
            startTime + 28 * oneDay,
            startTime + 29 * oneDay,
            startTime + 30 * oneDay,
            startTime + 31 * oneDay,
            startTime + 32 * oneDay,
            startTime + 33 * oneDay,
            startTime + 34 * oneDay,
            startTime + 35 * oneDay,
            startTime + 36 * oneDay,
        ];


        const scheduleRewards = [
            web3.utils.toWei('150000000', 'ether'),
            web3.utils.toWei('140000000', 'ether'),
            web3.utils.toWei('136000000', 'ether'),
            web3.utils.toWei('132000000', 'ether'),
            web3.utils.toWei('128000000', 'ether'),
            web3.utils.toWei('124000000', 'ether'),
            web3.utils.toWei('120000000', 'ether'),
            web3.utils.toWei('116000000', 'ether'),
            web3.utils.toWei('112000000', 'ether'),
            web3.utils.toWei('108000000', 'ether'),
            web3.utils.toWei('104000000', 'ether'),
            web3.utils.toWei('100000000', 'ether'),
            web3.utils.toWei('96000000', 'ether'),
            web3.utils.toWei('92000000', 'ether'),
            web3.utils.toWei('88000000', 'ether'),
            web3.utils.toWei('84000000', 'ether'),
            web3.utils.toWei('80000000', 'ether'),
            web3.utils.toWei('76000000', 'ether'),
            web3.utils.toWei('72000000', 'ether'),
            web3.utils.toWei('68000000', 'ether'),
            web3.utils.toWei('64000000', 'ether'),
            web3.utils.toWei('60000000', 'ether'),
            web3.utils.toWei('56000000', 'ether'),
            web3.utils.toWei('52000000', 'ether'),
            web3.utils.toWei('48000000', 'ether'),
            web3.utils.toWei('44000000', 'ether'),
            web3.utils.toWei('40000000', 'ether'),
            web3.utils.toWei('36000000', 'ether'),
            web3.utils.toWei('32000000', 'ether'),
            web3.utils.toWei('28000000', 'ether'),
            web3.utils.toWei('24000000', 'ether'),
            web3.utils.toWei('20000000', 'ether'),
            web3.utils.toWei('16000000', 'ether'),
            web3.utils.toWei('12000000', 'ether'),
            web3.utils.toWei('8000000', 'ether'),
            web3.utils.toWei('4000000', 'ether'),
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
            }]
            },  [MultiSigWallet.address, vaultService.address, MainToken.address, VMainToken.address, 
                weightObject, scheduleTimes, scheduleRewards, tau, 
                voteObject, maxNumberOfLocks, RewardsCalculator.address]);
        
        await deployer.deploy(StakingProxyAdmin, {gas:8000000});
        await deployer.deploy(StakingProxy, StakingPackage.address, StakingProxyAdmin.address, toInitialize, {gas:8000000});
        
        await vaultService.initAdminAndOperator(MultiSigWallet.address,StakingProxy.address)
    } catch(error) {
        console.log(error)
    }
}