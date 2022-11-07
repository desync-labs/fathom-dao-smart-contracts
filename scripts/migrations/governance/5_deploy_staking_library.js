const RewardsValidator = artifacts.require('./dao/staking/library/RewardsValidator.sol');
module.exports = async function(deployer) {
    let promises = [
        deployer.deploy(RewardsValidator, {gas: 8000000})
    ]
    await Promise.all(promises);
}