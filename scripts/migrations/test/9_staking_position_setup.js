const StakingPositionFactory = artifacts.require("./dao/staking/staking-position/StakingPositionFactory.sol");
const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
const StakingProxy = artifacts.require('./common/proxy/StakingProxy.sol')
const MainToken = artifacts.require("./dao/tokens/MainToken.sol");
const StakingPosition = artifacts.require("./dao/staking/staking-position/StakingPosition.sol");
const StakingPositionAndFactoryProxyAdmin = artifacts.require("./dao/staking/staking-position/proxy/StakingPositionAndFactoryProxyAdmin.sol")
const StakingPositionFactoryProxy = artifacts.require("./dao/staking/staking-position/proxy/StakingPositionFactoryProxy.sol")
const VMainToken = artifacts.require('./dao/tokens/VMainToken.sol');

module.exports = async function(deployer) {

    await deployer.deploy(
        StakingPositionAndFactoryProxyAdmin, {gas: 8000000}
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
            name: '_stakingPositionImplementation'
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
        StakingPosition.address,
        VMainToken.address,
        StakingPositionAndFactoryProxyAdmin.address
    ])

    console.log("Mutlisig --", MultiSigWallet.address)
    
    await deployer.deploy(
        StakingPositionFactoryProxy, 
        StakingPositionFactory.address, 
        StakingPositionAndFactoryProxyAdmin.address, 
        toInitialize, 
        {gas:8000000});
}   