const TimelockController = artifacts.require('./dao/governance/TimelockController.sol');
const VMainToken = artifacts.require('./dao/tokens/VMainToken.sol');
const MainToken = artifacts.require("./dao/tokens/MainToken.sol");

const mainToken = {
    name: "Fathom",
    symbol: "FTHM",
    totalSupply: web3.utils.toWei("1000000", "ether"),
    issuer: accounts[0]
};

const vMainToken = {
    name: "Vote Fathom",
    symbol: "vFTHM"
};

module.exports =  async function(deployer) {
    let promises = [
        deployer.deploy(TimelockController, { gas: 12000000 }),
        deployer.deploy(
            VMainToken,
            vMainToken.name,
            vMainToken.symbol,
            { gas: 12000000}
        ),
        deployer.deploy(
            MainToken,
            mainToken.name,
            mainToken.symbol,
            mainToken.totalSupply,
            mainToken.issuer,
            { gas: 12000000 }
        ),
    ];

    await Promise.all(promises);
};
