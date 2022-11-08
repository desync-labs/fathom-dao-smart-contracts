const blockchain = require("../../tests/helpers/blockchain");


const FTHMTokenTimelock = artifacts.require("./dao/treasury/FTHMTokenTimelock.sol");
const MainToken = artifacts.require("./dao/governance/token/ERC20/ERC20MainToken.sol");


const oneYr = 365 * 24 * 60 * 60;

const _getTimeStamp = async () => {
    const timestamp = await blockchain.getLatestBlockTimestamp()
    return timestamp
}
module.exports =  async function(deployer) {
    let promises = [

        deployer.deploy(FTHMTokenTimelock, MainToken.address, accounts[0], await _getTimeStamp() + oneYr,  { gas: 12000000 }),
    ];

    await Promise.all(promises);
};
