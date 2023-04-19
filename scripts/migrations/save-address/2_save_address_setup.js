const VaultProxyAdmin = artifacts.require('./common/proxy/VaultProxyAdmin.sol');
const VaultProxy = artifacts.require('./common/proxy/VaultProxy.sol')
const fs = require('fs')

let env = process.env.NODE_ENV || 'dev';
let addressesFilePath = `../../../addresses.${env}.json`;
const rawdata = fs.readFileSync(addressesFilePath);

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

    let env = process.env.NODE_ENV || 'dev';
    let filePath = `./addresses.${env}.json`;
    
    let data = JSON.stringify(newAddresses, null, " ");
    fs.writeFileSync(filePath, data, function (err) {
        if (err) {
            console.log(err);
        }
    });
}