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
    fs.writeFileSync('./addresses.json',data, function(err){
        if(err){
            console.log(err)
        }
    })

    return [deployedProxyAdmin.address, deployedProxy.address]
}

module.exports = { deployProxy };


  

