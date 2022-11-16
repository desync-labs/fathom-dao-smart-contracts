const { Manifest, logWarning, ProxyDeployment, BeaconProxyUnsupportedError } = require('@openzeppelin/upgrades-core');
const ProxyAdmin = artifacts.require('./common/proxy/transparent/ProxyAdmin.sol');
const TransparentUpgradeableProxy = artifacts.require('./common/proxy/transparent/TransparentUpgradeableProxy.sol');

async function deployProxy(
    deployer,
    packageAddr,
    toInitialize
)
{
  const provider = await web3.currentProvider;
  let promises = [
        deployer.deploy(ProxyAdmin, {gas:8000000})
    ];
  await Promise.all(promises);
  await deployer.deploy(TransparentUpgradeableProxy, packageAddr, ProxyAdmin.address, toInitialize,{gas:8000000})
}

module.exports = { deployProxy };


  

