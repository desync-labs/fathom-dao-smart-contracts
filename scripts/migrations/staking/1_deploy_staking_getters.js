// const ERC20TokenReward1 = artifacts.require("./registry-layer/tokens-factory/tokens/ERC-20/ERC20Token.sol");
const StakingGetters = artifacts.require('./dao/staking/helpers/StakingGettersHelper.sol')
const PackageStaking = artifacts.require('./dao/staking/packages/StakingPackage.sol');


const PackageStakingAddress = "xdcA82a7351ccd2949566305850A0877BA86E0e6a33"
module.exports = async function(deployer) {

    let promises = [
        deployer.deploy(StakingGetters, PackageStakingAddress,{gas: 8000000})
    ];

    await Promise.all(promises);
}