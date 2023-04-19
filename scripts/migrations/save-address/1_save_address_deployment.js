const VMainToken = artifacts.require('./dao/tokens/VMainToken.sol');
const TimelockController = artifacts.require('./dao/governance/TimelockController.sol');
const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
const MainToken = artifacts.require("./dao/tokens/MainToken.sol");
const MainTokenGovernor = artifacts.require('./dao/governance/MainTokenGovernor.sol');
const PackageStaking = artifacts.require('./dao/staking/packages/StakingPackage.sol');
const VaultPackage = artifacts.require('./dao/staking/vault/packages/VaultPackage.sol');
const RewardsCalculator = artifacts.require('./dao/staking/packages/RewardsCalculator.sol');
const fs = require('fs')
module.exports = async function(deployer) {
    let addresses = {
        vFTHM: VMainToken.address,
        timelockController: TimelockController.address,
        multiSigWallet: MultiSigWallet.address,
        fthmToken: MainToken.address,
        fthmGovernor: MainTokenGovernor.address,
        stakingImplementation: PackageStaking.address,
        vaultImplementation: VaultPackage.address,
        rewardsCalculator: RewardsCalculator.address,
    }
    
    let env = process.env.NODE_ENV || 'dev';
    let filePath = `./addresses.${env}.json`;

    let data = JSON.stringify(addresses, null, " ");
    fs.writeFileSync(filePath, data, function (err) {
        if (err) {
            console.log(err);
        }
    });

}