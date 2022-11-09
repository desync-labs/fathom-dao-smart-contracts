const blockchain = require("../../tests/helpers/blockchain");


const TokenTimelock = artifacts.require("./dao/governance/TokenTimelock.sol");
const MainToken = artifacts.require("./dao/tokens/MainToken.sol");

const oneYr = 365 * 24 * 60 * 60;

const _getTimeStamp = async () => {
    const timestamp = await blockchain.getLatestBlockTimestamp()
    return timestamp
}
module.exports =  async function(deployer) {
    let promises = [
        deployer.deploy(
            TokenTimelock,
            MainToken.address,
            accounts[0], // beneficiary
            await _getTimeStamp() + oneYr, // release time
            { gas: 12000000 }
        ),
    ];

    await Promise.all(promises);
};
