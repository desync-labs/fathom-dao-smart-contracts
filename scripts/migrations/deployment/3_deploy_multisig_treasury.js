const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
const TimelockController = artifacts.require('./dao/governance/TimelockController.sol');

const TimelockController_address = TimelockController.address;

const COUNCIL_0 = accounts[0];
const owners = [
    COUNCIL_0
];

const confirmationsRequired = 1;

module.exports =  async function(deployer) {
    let promises = [
        deployer.deploy(
            MultiSigWallet,
            owners,
            confirmationsRequired,
            TimelockController_address,
            { gas: 12000000 }
        ),
    ];

    await Promise.all(promises);
};
