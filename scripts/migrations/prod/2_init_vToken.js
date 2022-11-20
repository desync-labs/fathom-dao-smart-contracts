const VMainToken = artifacts.require('./dao/tokens/VMainToken.sol');
const IVMainToken = artifacts.require('./dao/tokens/IVMainToken.sol');


const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
const fs = require('fs');
const rawdata = fs.readFileSync('../../../addresses.json');
let proxyAddress = JSON.parse(rawdata);
module.exports = async function(deployer) {
    const vToken = await IVMainToken.at(VMainToken.address);
    await vToken.initToken(MultiSigWallet.address, proxyAddress.StakingProxy, {gas: 8000000});
}