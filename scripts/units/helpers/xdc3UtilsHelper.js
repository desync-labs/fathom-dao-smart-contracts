const XDCWeb3 = require('xdc3');
const { networks } = require("../../../coralX-config")


async function getCurrentTimestamp () {
    const web3 = getWeb3Instance()
    var blockNumber = await web3.eth.getBlockNumber();
    var block = await web3.eth.getBlock(blockNumber);
    var timestamp = block.timestamp;
    return timestamp;
  }
  
module.exports = { 
    getCurrentTimestamp,
};

function getWeb3Instance(){
    return new XDCWeb3(new XDCWeb3.providers.HttpProvider(networks.apothem.host))
}