const StakingPositionFactory = artifacts.require("./dao/staking/staking-position/StakingPositionFactory.sol");
const StakingPosition = artifacts.require("./dao/staking/staking-position/StakingPosition.sol");
module.exports = async function(deployer) {
    let promises = [
        deployer.deploy(StakingPosition, {gas: 8000000}),
        deployer.deploy(StakingPositionFactory, {gas: 8000000}),
    ]

    await Promise.all(promises);
}