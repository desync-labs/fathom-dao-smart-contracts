const VMainToken = artifacts.require('./dao/tokens/VMainToken.sol');
const IVMainToken = artifacts.require('./dao/tokens/IVMainToken.sol');

const StakingPackage = artifacts.require('./dao/staking/packages/StakingPackage.sol');

const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");

module.exports = async function(deployer) {
    const vToken = await IVMainToken.at(VMainToken.address);
    await vToken.initToken(MultiSigWallet.address, StakingPackage.address, {gas: 8000000});
}