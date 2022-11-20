const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
const MainToken = artifacts.require("./dao/tokens/MainToken.sol");

const mainToken = {
    name: "Fathom",
    symbol: "FTHM",
    totalSupply: web3.utils.toWei("1000000", "ether"),
    issuer: MultiSigWallet.address
};

module.exports =  async function(deployer) {
    let promises = [
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

