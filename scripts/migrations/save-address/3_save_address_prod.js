const StakingProxyAdmin = artifacts.require('./common/proxy/StakingProxyAdmin.sol');
const StakingProxy = artifacts.require('./common/proxy/StakingProxy.sol')
const StakingGettersHelper = artifacts.require('./dao/staking/helpers/StakingGettersHelper.sol')
const fs = require('fs')
let env = process.env.NODE_ENV || 'demo';
let addressesFilePath = `../../../addresses.${env}.json`;

const rawdata = fs.readFileSync(addressesFilePath);
let daoAddress = JSON.parse(rawdata)
module.exports = async function(deployer) {
    let addresses = {
        stakingProxyAdmin: StakingProxyAdmin.address,
        staking: StakingProxy.address,
        stakingGetter: StakingGettersHelper.address
    }

    const newAddresses = {
        ...daoAddress,
        ...addresses
    }

    let env = process.env.NODE_ENV || 'demo';
    let filePath = `./addresses.${env}.json`;
    
    let data = JSON.stringify(newAddresses, null, " ");
    fs.writeFileSync(filePath, data, function (err) {
        if (err) {
            console.log(err);
        }
    });
}