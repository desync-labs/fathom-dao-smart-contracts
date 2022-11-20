const MainToken = artifacts.require("./dao/tokens/MainToken.sol");
const upgrades = require("../../helpers/upgrades");

const IVault = artifacts.require('./dao/staking/vault/interfaces/IVault.sol');
const Vault = artifacts.require('./dao/staking/vault/packages/VaultPackage.sol');

module.exports = async function(deployer) {
    const vault = await IVault.at(Vault.address);

    let toInitialize =  web3.eth.abi.encodeFunctionCall({
        name: 'initVault',
        type: 'function',
        inputs: [{
            type: 'address[]',
            name: 'supportedTokens'
            }
          ]
        },  [[MainToken.address]]);

    [proxyAdminAddr, proxyAddr] = await upgrades.deployProxy(
        deployer, 
        vault.address, 
        toInitialize, 
        "VaultProxyAdmin",
        "VaultProxy"
    );
}