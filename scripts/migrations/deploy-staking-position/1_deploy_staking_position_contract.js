const StakingPositionFactory = artifacts.require("./dao/staking/staking-position/StakingPositionFactory.sol");
module.exports = async function(deployer) {
    let promises = [
        deployer.deploy(StakingPositionFactory, {gas: 8000000}),
    ]

    await Promise.all(promises);
}