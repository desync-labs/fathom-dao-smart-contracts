const PackageStaking = artifacts.require('./dao/staking/packages/StakingPackage.sol');
const fs = require('fs');

const VaultPackage = artifacts.require('./dao/staking/vault/packages/VaultPackage.sol');
const RewardsCalculator = artifacts.require('./dao/staking/packages/RewardsCalculator.sol');
const TransparentUpgradeableProxy = artifacts.require('./common/proxy/transparent/TransparentUpgradeableProxy.sol');
const ProxyAdmin = artifacts.require('./common/proxy/transparent/ProxyAdmin.sol');

const blockchain = require("../../tests/helpers/blockchain");
const upgrades = require("../../tests/helpers/upgrades");
const VMainToken = artifacts.require('./dao/tokens/VMainToken.sol');

const IStaking = artifacts.require('./dao/staking/interfaces/IStaking.sol');
const StakingPackage = artifacts.require('./dao/staking/packages/StakingPackage.sol');

const MainToken = artifacts.require("./dao/tokens/MainToken.sol");

const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
const IVault = artifacts.require('./dao/staking/vault/interfaces/IVault.sol');

const Vault = artifacts.require('./dao/staking/vault/packages/VaultPackage.sol');
const rawdata = fs.readFileSync('../../../addresses.json');
let proxyAddress = JSON.parse(rawdata);

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

    const vaultService = await IVault.at(proxyAddress.VaultProxy)

    let toInitialize =  web3.eth.abi.encodeFunctionCall({
        name: 'initializeStaking',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_admin'
        },{
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
        },{
            type: 'uint256[]',
            name: 'scheduleRewards'
        },{
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
        },{
            type: 'uint256',
            name: '_maxLocks'
        },
        {
            type: 'address',
            name: '_rewardsContract'
        }
        ]
        },  [MultiSigWallet.address,vaultService.address, MainToken.address, VMainToken.address, 
            [1024,256,3000,100,10], scheduleTimes,scheduleRewards, tau, 
            [vMainTokenCoefficient,lockingVoteWeight], maxNumberOfLocks, RewardsCalculator.address]);
    
    let promises = [
        deployer.deploy(ProxyAdmin, {gas:8000000})
    ];

    await Promise.all(promises);
    const deployedStakingProxyAdmin = artifacts.require('./common/proxy/transparent/ProxyAdmin.sol');

    await deployer.deploy(TransparentUpgradeableProxy, StakingPackage.address, ProxyAdmin.address, toInitialize,{gas:8000000})
    const deployedStakingProxy = artifacts.require('./common/proxy/transparent/TransparentUpgradeableProxy.sol');

    let addressUpdate = {
        StakingProxyAdmin:deployedStakingProxyAdmin.address,
        StakingProxy: deployedStakingProxy.address
    }
    
    const newAddresses = {
        ...proxyAddress,
        ...addressUpdate
    }

    await vaultService.initAdminAndOperator(MultiSigWallet.address,deployedStakingProxy.address)
    let data = JSON.stringify(newAddresses);
    fs.writeFileSync('./addresses.json',data, function(err){
        if(err){
            console.log(err)
        }
    })
    // await upgrades.deployProxy(
    //     deployer,
    //     StakingPackage.address,
    //     toInitialize,
    //     "StakingProxyAdmin",
    //     "StakingProxy"
    // )

}