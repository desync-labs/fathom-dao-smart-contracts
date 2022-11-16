const PackageStaking = artifacts.require('./dao/staking/packages/StakingPackage.sol');

const MainToken = artifacts.require("./dao/tokens/MainToken.sol");

const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");

const IVault = artifacts.require('./dao/staking/vault/interfaces/IVault.sol');
const Vault = artifacts.require('./dao/staking/vault/packages/VaultPackage.sol');

module.exports = async function(deployer) {
    const vault = await IVault.at(Vault.address);
    
    await vault.initVault(MultiSigWallet.address, PackageStaking.address, [MainToken.address], {gas: 8000000});
}