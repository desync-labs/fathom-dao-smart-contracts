const TimelockController = artifacts.require('./dao/governance/TimelockController.sol');
const VMainToken = artifacts.require('./dao/governance/VMainToken.sol');
const Box = artifacts.require('./dao/governance/Box.sol');
const MainToken = artifacts.require("./dao/treasury/MainToken.sol");
const ERC20Factory = artifacts.require("./dao/token-factory/ERC20Factory.sol");


module.exports =  async function(deployer) {
    let promises = [
        deployer.deploy(TimelockController, { gas: 12000000 }),
        deployer.deploy(VMainToken, { gas: 12000000}),
        deployer.deploy(Box, { gas: 12000000 }),
        deployer.deploy(ERC20Factory, { gas: 12000000 }),
        deployer.deploy(MainToken, { gas: 12000000 }),
    ];

    await Promise.all(promises);
};
