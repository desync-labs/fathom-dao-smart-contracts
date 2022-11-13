const Box = artifacts.require('./dao/test/Box.sol');
const ERC20Factory = artifacts.require("./dao/test/token-factory/ERC20Factory.sol");
const ERC20TokenReward1 = artifacts.require("./dao/test/ERC20Rewards1.sol");
const ERC20TokenReward2 = artifacts.require("./dao/test/ERC20Rewards2.sol");


module.exports =  async function(deployer) {
    let promises = [
        deployer.deploy(Box, { gas: 12000000 }),
        deployer.deploy(ERC20Factory, { gas: 12000000 }),
        deployer.deploy(ERC20TokenReward1, "Reward2 Tokens", "R2T", web3.utils.toWei("1000000","ether"), accounts[0], { gas: 3600000 }),
        deployer.deploy(ERC20TokenReward2, "Reward2 Tokens", "R3T", web3.utils.toWei("1000000","ether"), accounts[0], { gas: 3600000 }),
    ];

    await Promise.all(promises);
};
