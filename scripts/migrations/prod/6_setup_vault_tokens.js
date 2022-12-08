const eventsHelper = require("../../tests/helpers/eventsHelper");

const IVault = artifacts.require('./dao/staking/vault/interfaces/IVault.sol');
const MainToken = artifacts.require("./dao/tokens/MainToken.sol");
const IERC20 = artifacts.require("./dao/tokens/ERC20/IERC20.sol");

const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const EMPTY_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000';
const SUBMIT_TRANSACTION_EVENT = "SubmitTransaction(uint256,address,address,uint256,bytes)";

const T_TO_TRANSFER = web3.utils.toWei('150000000', 'ether');
const VaultProxy = artifacts.require('./common/proxy/VaultProxy.sol')


const _encodeTransferFunction = (_account, _amount) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'transfer',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'to'
        },{
            type: 'uint256',
            name: 'amount'
        }]
    }, [_account, _amount]);

    return toRet;
}

module.exports = async function(deployer) {
    const vaultService = await IVault.at(VaultProxy.address)
    const multiSigWallet = await IMultiSigWallet.at(MultiSigWallet.address)
    let result = await multiSigWallet.submitTransaction(
        MainToken.address, 
        EMPTY_BYTES, 
        _encodeTransferFunction(vaultService.address, T_TO_TRANSFER),
        {gas: 8000000}
    );

    let txIndex = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    await multiSigWallet.confirmTransaction(txIndex, {gas: 8000000});
    await multiSigWallet.executeTransaction(txIndex, {gas: 8000000});
}
