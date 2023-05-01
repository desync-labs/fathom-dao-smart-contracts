const PackageStakingImplementation = artifacts.require('./dao/staking/packages/StakingPackage.sol');
const fs = require("fs");

module.exports = async function(deployer) {
    let promises = [
        deployer.deploy(PackageStakingImplementation, {gas: 8000000}),
    ]
    await Promise.all(promises);

    let addresses = {
        newStakingPackageImplementation: PackageStakingImplementation.address
    }

    let env = process.env.NODE_ENV || 'demo';
    let filePath = `./addresses.new-staking-package.${env}.json`;

    let data = JSON.stringify(addresses, null, " ");
    fs.writeFileSync(filePath, data, function (err) {
        if (err) {
            console.log(err);
        }
    });
}