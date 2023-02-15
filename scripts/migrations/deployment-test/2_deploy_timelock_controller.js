const TimelockController = artifacts.require('./dao/governance/TimelockController.sol');

module.exports =  async function(deployer) {
    let promises = [
        deployer.deploy(TimelockController, { gas: 12000000 }),
    ];

    await Promise.all(promises);
};
