const VMainToken = artifacts.require('./dao/tokens/VMainToken.sol');

const vMainToken = {
    name: "Fathom Protocol Vote Token",
    symbol: "VFTHM"
};

module.exports =  async function(deployer) {
    let promises = [
        deployer.deploy(
            VMainToken,
            vMainToken.name,
            vMainToken.symbol,
            { gas: 12000000}
        ),
    ];

    await Promise.all(promises);
};
