// components
const TimelockController = artifacts.require('./dao/governance/TimelockController.sol');
const MainTokenGovernor = artifacts.require('./dao/governance/MainTokenGovernor.sol');

// interfaces
const ITimelockController = artifacts.require('./dao/governance/interfaces/ITimelockController.sol');

const minDelay = 1;
const proposers = [MainTokenGovernor.address];
const executors = [MainTokenGovernor.address];

module.exports = async function(deployer) {
    const timelockController = await ITimelockController.at(TimelockController.address);

    await timelockController.initialize(
        minDelay,
        proposers,
        executors,
        { gas: 120000000 }
    );
};
