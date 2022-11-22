const VMainToken = artifacts.require('./dao/tokens/VMainToken.sol');
const TimelockController = artifacts.require('./dao/governance/TimelockController.sol');
const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
const MainToken = artifacts.require("./dao/tokens/MainToken.sol");
const MainTokenGovernor = artifacts.require('./dao/governance/MainTokenGovernor.sol');
const PackageStaking = artifacts.require('./dao/staking/packages/StakingPackage.sol');
const VaultPackage = artifacts.require('./dao/staking/vault/packages/VaultPackage.sol');
const RewardsCalculator = artifacts.require('./dao/staking/packages/RewardsCalculator.sol');
const StakingProxyAdmin = artifacts.require('./common/proxy/StakingProxyAdmin.sol');
const StakingProxy = artifacts.require('./common/proxy/StakingProxy.sol')
const VaultProxyAdmin = artifacts.require('./common/proxy/VaultProxyAdmin.sol');
const VaultProxy = artifacts.require('./common/proxy/VaultProxy.sol')
const StakingGettersHelper = artifacts.require('./dao/staking/helpers/StakingGettersHelper.sol')
const fs = require('fs')
module.exports = async function(deployer) {
    let addresses = {
        vFTHM: VMainToken.address,
        timelockController: TimelockController.address,
        multiSigWallet: MultiSigWallet.address,
        fthmToken: MainToken.address,
        fthmGovernor: MainTokenGovernor.address,
        stakingPackage: PackageStaking.address,
        vaultPackage: VaultPackage.address,
        rewardsCalculator: RewardsCalculator.address,
        stakingProxyAdmin: StakingProxyAdmin.address,
        stakingProxy: StakingProxy.address,
        vaultProxyAdmin: VaultProxyAdmin.address,
        vaultProxy: VaultProxy.address,
        stakingGettersHelper: StakingGettersHelper.address
    }
    
    let data = JSON.stringify(addresses);
    fs.writeFileSync('./build/build_system_addresses.json',data, function(err){
        if(err){
            console.log(err)
        }
    })

}