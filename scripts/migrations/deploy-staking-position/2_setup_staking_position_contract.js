const StakingPositionFactory = artifacts.require("./dao/staking/staking-position/StakingPositionFactory.sol");
const StakingPositionFactoryProxyAdmin = artifacts.require("./dao/staking/staking-position/proxy/StakingPositionFactoryProxyAdmin.sol")
const StakingPositionFactoryProxy = artifacts.require("./dao/staking/staking-position/proxy/StakingPositionFactoryProxy.sol")
const fs = require("fs")
let env = process.env.NODE_ENV;
let addressesFilePath = `../../../addresses.${env}.json`;
const rawdata = fs.readFileSync(addressesFilePath);
const addresses = JSON.parse(rawdata);

const MultiSigWalletAddress = addresses.multiSigWallet
const StakingAddress = addresses.staking
const MainTokenAddress = addresses.fthmToken
const VMainTokenAddress = addresses.vFTHM

module.exports = async function(deployer) {
    await deployer.deploy(
        StakingPositionFactoryProxyAdmin, {gas: 8000000}
    )
    
    let toInitialize = web3.eth.abi.encodeFunctionCall({
        name: 'initialize',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_admin'
        },
        {
            type: 'address',
            name: '_stakingContract'
        },
        {
            type: 'address',
            name: '_mainToken'
        },
        {
            type: 'address',
            name: '_voteToken'
        },
        {
            type: 'address',
            name: '_proxyAdmin'
        }
        ]
    }, [
        MultiSigWalletAddress,
        StakingAddress,
        MainTokenAddress,
        VMainTokenAddress,
        StakingPositionFactoryProxyAdmin.address
    ])
    
    await deployer.deploy(
        StakingPositionFactoryProxy, 
        StakingPositionFactory.address, 
        StakingPositionFactoryProxyAdmin.address, 
        toInitialize, 
        {gas:8000000});


    let addresses = {
        StakingPositionFactory: StakingPositionFactoryProxy.address,
        StakingPositionFactoryImplementation: StakingPositionFactory.address,
        StakingPositionAndFactoryProxyAdmin: StakingPositionFactoryProxyAdmin.address,
    }

    let env = process.env.NODE_ENV || 'demo';
    let filePath = `./addresses.staking-position.${env}.json`;

    let data = JSON.stringify(addresses, null, " ");
    fs.writeFileSync(filePath, data, function (err) {
        if (err) {
            console.log(err);
        }
    });
}   