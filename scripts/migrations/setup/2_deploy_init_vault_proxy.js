const PackageStaking = artifacts.require('./dao/staking/packages/StakingPackage.sol');
const fs = require('fs');

const MainToken = artifacts.require("./dao/tokens/MainToken.sol");

const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");

const TransparentUpgradeableProxy = artifacts.require('./common/proxy/transparent/TransparentUpgradeableProxy.sol');
const ProxyAdmin = artifacts.require('./common/proxy/transparent/ProxyAdmin.sol');

const IVault = artifacts.require('./dao/staking/vault/interfaces/IVault.sol');
const Vault = artifacts.require('./dao/staking/vault/packages/VaultPackage.sol');
const rawdata = fs.readFileSync('../../../addresses.json');
let proxyAddress = JSON.parse(rawdata);

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

    let promises = [
        deployer.deploy(ProxyAdmin, {gas:8000000})
    ];
    await Promise.all(promises);
    const deployedVaultProxyAdmin = artifacts.require('./common/proxy/transparent/ProxyAdmin.sol');
    
    await deployer.deploy(TransparentUpgradeableProxy, vault.address, ProxyAdmin.address, toInitialize,{gas:8000000})

    const deployedVaultProxy = artifacts.require('./common/proxy/transparent/TransparentUpgradeableProxy.sol');
    
    let addressUpdate = {
        VaultProxyAdmin:deployedVaultProxyAdmin.address,
        VaultProxy: deployedVaultProxy.address
    }
    
    const newAddresses = {
        ...proxyAddress,
        ...addressUpdate
    }

    let data = JSON.stringify(newAddresses);
    fs.writeFileSync('./addresses.json', data);
    
    //initing twice! check other initializers also!
    //await upgrades.deployProxy(deployer, vault.address, toInitialize)
}