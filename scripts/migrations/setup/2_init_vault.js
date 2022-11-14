const StakingPackage = artifacts.require('./dao/staking/packages/StakingPackage.sol');

const MainToken = artifacts.require("./dao/tokens/MainToken.sol");

const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");

const IVault = artifacts.require('./dao/staking/vault/interfaces/IVault.sol');
const Vault = artifacts.require('./dao/staking/vault/packages/VaultPackage.sol');

module.exports = async function(deployer) {
    const vault = await IVault.at(Vault.address);
    //initing twice! check other initializers also!
    await vault.initVault(MultiSigWallet.address, StakingPackage.address, [MainToken.address], {gas: 8000000});
}