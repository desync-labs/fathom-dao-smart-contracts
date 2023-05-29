const Box = artifacts.require('./dao/test/Box.sol');
const ERC20Factory = artifacts.require("./dao/test/token-factory/ERC20Factory.sol");
const ERC20TokenReward1 = artifacts.require("./dao/test/ERC20Rewards1.sol");
const ERC20TokenReward2 = artifacts.require("./dao/test/ERC20Rewards2.sol");

const blockchain = require("../../tests/helpers/blockchain");

const TokenTimelock = artifacts.require("./dao/test/token-timelock/TokenTimelock.sol");
const MainToken = artifacts.require("./dao/tokens/MainToken.sol");

const oneYr = 365 * 24 * 60 * 60;
const VaultProxyAdmin = artifacts.require('./dao/test/VaultProxyAdminMigrate.sol');
const VaultProxy = artifacts.require('./dao/test/VaultProxyMigrate.sol')
const Vault = artifacts.require('./dao/staking/vault/packages/VaultPackage.sol');
const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");

const _getTimeStamp = async () => {
    const timestamp = await blockchain.getLatestBlockTimestamp()
    return timestamp
}

module.exports =  async function(deployer) {
    let promises = [
        deployer.deploy(Box, { gas: 12000000 }),
        deployer.deploy(ERC20Factory, { gas: 12000000 }),
        deployer.deploy(ERC20TokenReward1, "Reward2 Tokens", "R2T", web3.utils.toWei("100000000","ether"), accounts[0], { gas: 3600000 }),
        deployer.deploy(ERC20TokenReward2, "Reward2 Tokens", "R3T", web3.utils.toWei("100000000","ether"), accounts[0], { gas: 3600000 }),deployer.deploy(
            TokenTimelock,
            MainToken.address,
            accounts[0], // beneficiary
            await _getTimeStamp() + oneYr, // release time
            { gas: 12000000 }
        ),
    ];

    await Promise.all(promises);

    let toInitialize =  web3.eth.abi.encodeFunctionCall({
        name: 'initVault',
        type: 'function',
        inputs: [{
                type: 'address',
                name: '_admin'
            },
            {
                type: 'address[]',
                name: 'supportedTokens'
            }
          ]
        },  [MultiSigWallet.address,[MainToken.address]]);

    await deployer.deploy(VaultProxyAdmin, {gas:8000000});
    await deployer.deploy(VaultProxy, Vault.address, VaultProxyAdmin.address, toInitialize, {gas:8000000});
};
