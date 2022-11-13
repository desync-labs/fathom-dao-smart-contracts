const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
const TimelockController = artifacts.require('./dao/governance/TimelockController.sol');

const TimelockController_address = TimelockController.address;

const owners = [
    "0x4C5F0f90a2D4b518aFba11E22AC9b8F6B031d204"
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
