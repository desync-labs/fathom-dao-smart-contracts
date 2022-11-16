const PackageStaking = artifacts.require('./common/proxy/transparent/TransparentUpgradeableProxy.sol');
const StakingGettersHelper = artifacts.require('./dao/staking/helpers/StakingGettersHelper.sol')
const fs = require('fs');

const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
const rawdata = fs.readFileSync('../../../addresses.json');
let proxyAddress = JSON.parse(rawdata);

module.exports = async function(deployer) {
    let promises = [
        deployer.deploy(StakingGettersHelper, proxyAddress.StakingProxy, MultiSigWallet.address, {gas: 8000000})
    ];

    await Promise.all(promises);
}