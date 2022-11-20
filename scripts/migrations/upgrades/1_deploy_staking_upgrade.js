const PackageStakingUpgrade = artifacts.require('./dao/test/staking/upgrades/StakingUpgrade.sol');
const PackageVaultUpgrade = artifacts.require('./dao/test/staking/upgrades/VaultUpgrade.sol');

module.exports = async function(deployer) {
    let promises = [
        deployer.deploy(PackageStakingUpgrade, {gas: 8000000}),
        deployer.deploy(PackageVaultUpgrade, {gas:8000000})
    ]

    await Promise.all(promises);
}