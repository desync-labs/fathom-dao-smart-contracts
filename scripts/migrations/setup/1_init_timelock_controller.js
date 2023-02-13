// components
const TimelockController = artifacts.require('./dao/governance/TimelockController.sol');
const MainTokenGovernor = artifacts.require('./dao/governance/MainTokenGovernor.sol');
const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");

// interfaces
const ITimelockController = artifacts.require('./dao/governance/interfaces/ITimelockController.sol');
// A Scheduled operation is an operation that becomes valid after a given delay. 
// Once the delay time has passed, the operation can be performed. Each schedules delay must be at least minDelay.  
// minDelay is set in the initialize function call, and can be updated using function updateDelay.
const minDelay = 30; //?? What should be initialized?
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
