// components
const TimelockController = artifacts.require('./dao/governance/TimelockController.sol');

// interfaces
const ITimelockController = artifacts.require('./dao/governance/interfaces/ITimelockController.sol');

const minDelay = 1;
const proposers = [accounts[0]];
const executors = [accounts[0]];

module.exports = async function(deployer) {
    const timelockController = await ITimelockController.at(TimelockController.address);

    await timelockController.initialize(
        minDelay,
        proposers,
        executors,
        { gas: 120000000 }
    );
};
