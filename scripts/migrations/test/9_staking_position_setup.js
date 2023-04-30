const StakingPositionFactory = artifacts.require("./dao/staking/staking-position/StakingPositionFactory.sol");
const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
const StakingProxy = artifacts.require('./common/proxy/StakingProxy.sol')
const MainToken = artifacts.require("./dao/tokens/MainToken.sol");
const StakingPositionFactoryProxyAdmin = artifacts.require("./dao/staking/staking-position/proxy/StakingPositionFactoryProxyAdmin.sol")
const StakingPositionFactoryProxy = artifacts.require("./dao/staking/staking-position/proxy/StakingPositionFactoryProxy.sol")
const VMainToken = artifacts.require('./dao/tokens/VMainToken.sol');

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
        MultiSigWallet.address,
        StakingProxy.address,
        MainToken.address,
        VMainToken.address,
        StakingPositionFactoryProxyAdmin.address
    ])

    console.log("Mutlisig --", MultiSigWallet.address)
    
    await deployer.deploy(
        StakingPositionFactoryProxy, 
        StakingPositionFactory.address, 
        StakingPositionFactoryProxyAdmin.address, 
        toInitialize, 
        {gas:8000000});
}   