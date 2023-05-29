const PackageStaking = artifacts.require('./dao/staking/packages/StakingPackage.sol');
const VaultPackage = artifacts.require('./dao/staking/vault/packages/VaultPackage.sol');
const RewardsCalculator = artifacts.require('./dao/staking/packages/RewardsCalculator.sol');
const StakingPositionFactory = artifacts.require("./dao/staking/staking-position/StakingPositionFactory.sol");
module.exports = async function(deployer) {
    let promises = [
        deployer.deploy(RewardsCalculator, {gas: 8000000}),
        deployer.deploy(PackageStaking, {gas: 8000000}),
        deployer.deploy(VaultPackage, {gas: 8000000}),
        deployer.deploy(StakingPositionFactory, {gas: 8000000}),
    ]

    await Promise.all(promises);
}