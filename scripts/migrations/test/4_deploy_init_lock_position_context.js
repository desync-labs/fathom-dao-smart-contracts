const LockPositionContextProxy = artifacts.require('./common/proxy/LockPositionContextProxy.sol');
const LockPositionContextProxyAdmin = artifacts.require('./common/proxy/LockPositionContextProxyAdmin.sol')
const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
const LockPositionContext = artifacts.require('./dao/staking/context/LockPositionContext.sol');
const StakingProxy = artifacts.require('./common/proxy/StakingProxy.sol')

module.exports = async function(deployer) {

    let toInitialize =  web3.eth.abi.encodeFunctionCall({
        name: 'initialize',
        type: 'function',
        inputs: [{
                type: 'address',
                name: '_admin'
            },
            {
                type: 'address',
                name: '_stakingContract'
            }
          ]
        },  [MultiSigWallet.address,StakingProxy.address]);

    await deployer.deploy(LockPositionContextProxyAdmin, {gas:8000000});
    await deployer.deploy(LockPositionContextProxy, LockPositionContext.address, LockPositionContextProxyAdmin.address, toInitialize, {gas:8000000});
}