const StakingProxyAdmin = artifacts.require('./common/proxy/StakingProxyAdmin.sol');
const StakingProxy = artifacts.require('./common/proxy/StakingProxy.sol')
const StakingGettersHelper = artifacts.require('./dao/staking/helpers/StakingGettersHelper.sol')
const fs = require('fs')
const rawdata = fs.readFileSync('../../../build/build_system_addresses.json');
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

    
    let data = JSON.stringify(newAddresses);
    fs.writeFileSync('./build/build_system_addresses.json',data, function(err){
        if(err){
            console.log(err)
        }
    })

}