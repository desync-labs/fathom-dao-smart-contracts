const { Manifest, logWarning, ProxyDeployment, BeaconProxyUnsupportedError } = require('@openzeppelin/upgrades-core');
const ProxyAdmin = artifacts.require('./common/proxy/transparent/ProxyAdmin.sol');
const TransparentUpgradeableProxy = artifacts.require('./common/proxy/transparent/TransparentUpgradeableProxy.sol');
const fs = require('fs');

const rawdata = fs.readFileSync('../../../addresses.json');
let proxyAddress = JSON.parse(rawdata);

async function deployProxy(
    deployer,
    packageAddr,
    toInitialize,
    ProxyAdminName,
    ProxyName
)
{
  const provider = await web3.currentProvider;
  let promises = [
        deployer.deploy(ProxyAdmin, {gas:8000000})
    ];
  await Promise.all(promises);

  const deployedProxyAdmin = artifacts.require('./common/proxy/transparent/ProxyAdmin.sol');

  await deployer.deploy(TransparentUpgradeableProxy, packageAddr, ProxyAdmin.address, toInitialize,{gas:8000000})
  const deployedProxy = artifacts.require('./common/proxy/transparent/TransparentUpgradeableProxy.sol');
  
  let addressUpdate = {
        [ProxyAdminName]:deployedProxyAdmin.address,
        [ProxyName]: deployedProxy.address
    }
    const newAddresses = {
        ...proxyAddress,
        ...addressUpdate
    }
    
    let data = JSON.stringify(newAddresses);
    await fs.writeFileSync('./addresses.json', data);
    
}

module.exports = { deployProxy };


  

