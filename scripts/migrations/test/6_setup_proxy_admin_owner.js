const ProxyAdmin = artifacts.require('./common/proxy/transparent/ProxyAdmin.sol');
const fs = require('fs');
const rawdata = fs.readFileSync('../../../addresses.json');
let proxyAddress = JSON.parse(rawdata);
const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");

module.exports = async function(deployer) {
    const stakingProxyAdmin = await ProxyAdmin.at(proxyAddress.StakingProxyAdmin)
    await stakingProxyAdmin.transferOwnership(MultiSigWallet.address)
    const vaultProxyAdmin = await ProxyAdmin.at(proxyAddress.VaultProxyAdmin)
    await vaultProxyAdmin.transferOwnership(MultiSigWallet.address)
}