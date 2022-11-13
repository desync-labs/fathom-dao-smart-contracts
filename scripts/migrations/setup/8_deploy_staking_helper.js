const PackageStaking = artifacts.require('./dao/staking/packages/StakingPackage.sol');
const StakingGettersHelper = artifacts.require('./dao/staking/helpers/StakingGettersHelper.sol')

module.exports = async function(deployer) {
    let promises = [
        deployer.deploy(StakingGettersHelper, PackageStaking.address, {gas: 8000000})
    ];

    await Promise.all(promises);
}