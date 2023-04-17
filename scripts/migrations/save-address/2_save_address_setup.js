const VaultProxyAdmin = artifacts.require('./common/proxy/VaultProxyAdmin.sol');
const VaultProxy = artifacts.require('./common/proxy/VaultProxy.sol')
const fs = require('fs')
const rawdata = fs.readFileSync('../../../addresses.json');
let daoAddress = JSON.parse(rawdata)
module.exports = async function(deployer) {
    let addresses = {
        vaultProxyAdmin: VaultProxyAdmin.address,
        vault: VaultProxy.address,
    }

    const newAddresses = {
        ...daoAddress,
        ...addresses
    }

    
    let data = JSON.stringify(newAddresses, null, " ");
    fs.writeFileSync('./addresses.json',data, function(err){
        if(err){
            console.log(err)
        }
    })

}