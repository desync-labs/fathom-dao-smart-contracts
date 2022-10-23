const StakingGetters = artifacts.require('./dao/staking/helpers/StakingGettersHelper.sol')
const PackageStaking = artifacts.require('./dao/staking/packages/StakingPackage.sol');


module.exports = async function(deployer) {
    let promises = [
        deployer.deploy(StakingGetters, PackageStaking.address, {gas: 8000000})
    ];

    await Promise.all(promises);
}