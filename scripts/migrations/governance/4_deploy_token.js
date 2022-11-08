const MainToken = artifacts.require("./dao/governance/token/ERC20/ERC20MainToken.sol");
const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");

module.exports =  async function(deployer) {
    let promises = [
        deployer.deploy(MainToken, "Main Token", "MTT", web3.utils.toWei("1000000", "ether"), MultiSigWallet.address, { gas: 12000000 }),
    ];

    await Promise.all(promises);
};

