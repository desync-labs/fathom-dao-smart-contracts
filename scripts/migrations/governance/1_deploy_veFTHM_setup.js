const TimelockController = artifacts.require('./dao/governance/TimelockController.sol');
const VeMainToken = artifacts.require('./dao/governance/VeMainToken.sol');
const Box = artifacts.require('./dao/governance/Box.sol');
const MainToken = artifacts.require("./dao/treasury/MainToken.sol");


module.exports =  async function(deployer) {
    let promises = [
        deployer.deploy(TimelockController, { gas: 12000000 }),
        deployer.deploy(VeMainToken, { gas: 12000000}),
        deployer.deploy(Box, { gas: 12000000 }),
        deployer.deploy(MainToken, { gas: 12000000 }),
    ];

    await Promise.all(promises);
};
