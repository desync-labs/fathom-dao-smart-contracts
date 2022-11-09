const TimelockController = artifacts.require('./dao/governance/TimelockController.sol');
const VMainToken = artifacts.require('./dao/tokens/VMainToken.sol');

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
        )
    ];

    await Promise.all(promises);
};
