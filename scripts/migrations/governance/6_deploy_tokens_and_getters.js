const ERC20MainToken = artifacts.require('./dao/governance/token/ERC20/ERC20MainToken.sol');
const ERC20TokenReward1 = artifacts.require("./dao/governance/token/ERC20/ERC20Rewards1.sol");
const ERC20TokenReward2 = artifacts.require("./dao/governance/token/ERC20/ERC20Rewards2.sol");
const StakingGetters = artifacts.require('./dao/staking/helpers/StakingGettersHelper.sol')
const PackageStaking = artifacts.require('./dao/staking/packages/StakingPackage.sol');



module.exports = async function(deployer) {
    let promises = [
        deployer.deploy(ERC20MainToken, "Main Token", "MTT", web3.utils.toWei("1000000", "ether"), accounts[0], { gas: 3600000 }),
        deployer.deploy(ERC20TokenReward1, "Reward2 Tokens", "R2T", web3.utils.toWei("1000000","ether"), accounts[0], { gas: 3600000 }),
        deployer.deploy(ERC20TokenReward2, "Reward2 Tokens", "R3T", web3.utils.toWei("1000000","ether"), accounts[0], { gas: 3600000 }),
        deployer.deploy(StakingGetters, PackageStaking.address, {gas: 8000000})
    ];

    await Promise.all(promises);
}