const eventsHelper = require("../../tests/helpers/eventsHelper");
const constants = require("../../tests/helpers/testConstants");

const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const EMPTY_BYTES = constants.EMPTY_BYTES;
const SUBMIT_TRANSACTION_EVENT = constants.SUBMIT_TRANSACTION_EVENT

const VaultProxy = artifacts.require('./common/proxy/VaultProxy.sol')
const StakingProxy = artifacts.require('./common/proxy/StakingProxy.sol')

const _encodeAddRewardsOpertor = (_account, _amount) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'addRewardsOperator',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_rewardsOperator'
            }   
        ]
    }, [_account]);

    return toRet;
}

module.exports = async function(deployer) {
    const multiSigWallet = await IMultiSigWallet.at(MultiSigWallet.address)
    let result = await multiSigWallet.submitTransaction(
        VaultProxy.address, 
        EMPTY_BYTES, 
        _encodeAddRewardsOpertor(StakingProxy.address),
        0,
        {gas: 8000000}
    );

    let txIndex = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    await multiSigWallet.confirmTransaction(txIndex, {gas: 8000000});
    await multiSigWallet.executeTransaction(txIndex, {gas: 8000000});
}
