const blockchain = require("../../tests/helpers/blockchain");

const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
const TimelockController = artifacts.require('./dao/governance/TimelockController.sol');
const TokenTimelock = artifacts.require("./dao/treasury/TokenTimelock.sol");
const MainToken = artifacts.require("./dao/treasury/MainToken.sol");

const TimelockController_address = TimelockController.address;

const owners = ["0x4C5F0f90a2D4b518aFba11E22AC9b8F6B031d204", 
                "0xc0Ee98ac1a44B56fbe2669A3B3C006DEB6fDd0f9", 
                "0x01d2D3da7a42F64e7Dc6Ae405F169836556adC86"];

const oneYr = 365 * 24 * 60 * 60;

const _getTimeStamp = async () => {
    const timestamp = await blockchain.getLatestBlockTimestamp()
    return timestamp
}

module.exports =  async function(deployer) {
    let promises = [

        deployer.deploy(MultiSigWallet, owners, "2", TimelockController_address, { gas: 12000000 }),
        deployer.deploy(TokenTimelock, MainToken.address, accounts[0], await _getTimeStamp() + oneYr,  { gas: 12000000 }),
    ];

    await Promise.all(promises);
};
