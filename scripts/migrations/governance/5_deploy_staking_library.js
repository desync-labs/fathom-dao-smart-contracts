const StakingLibrary = artifacts.require('./dao/staking/library/StakingLibrary.sol');
module.exports = async function(deployer) {
    let promises = [
        deployer.deploy(StakingLibrary, {gas: 8000000})
    ]
    await Promise.all(promises);
}