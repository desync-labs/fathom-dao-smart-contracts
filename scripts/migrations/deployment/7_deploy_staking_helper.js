const PackageStaking = artifacts.require('./dao/staking/packages/StakingPackage.sol');
const StakingGettersHelper = artifacts.require('./dao/staking/helpers/StakingGettersHelper.sol')

const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");

module.exports = async function(deployer) {
    let promises = [
        deployer.deploy(StakingGettersHelper, PackageStaking.address, MultiSigWallet.address, {gas: 8000000})
    ];

    await Promise.all(promises);
}