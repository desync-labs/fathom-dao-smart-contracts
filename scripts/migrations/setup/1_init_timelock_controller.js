// components
const TimelockController = artifacts.require('./dao/governance/TimelockController.sol');
const MainTokenGovernor = artifacts.require('./dao/governance/MainTokenGovernor.sol');
const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");

// interfaces
const ITimelockController = artifacts.require('./dao/governance/interfaces/ITimelockController.sol');

const minDelay = 30;
const proposers = [MainTokenGovernor.address];
const executors = [MainTokenGovernor.address];

module.exports = async function(deployer) {
    const timelockController = await ITimelockController.at(TimelockController.address);

    await timelockController.initialize(
        minDelay,
        MultiSigWallet.address,
        proposers,
        executors,
        { gas: 120000000 }
    );
};
