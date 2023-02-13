const eventsHelper = require("../../tests/helpers/eventsHelper");

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");

const EMPTY_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000';
const SUBMIT_TRANSACTION_EVENT = "SubmitTransaction(uint256,address,address,uint256,bytes)";

const T_TO_TRANSFER_PLACEHOLDER = web3.utils.toWei('','ether') //SET AS NEEDED
const TRANSFER_TO_ACCOUNT_PLACEHOLDER = "" //SET AS NEEDED
const MULTISIG_WALLET_ADDRESS = "" //CONSTANT
const MAIN_TOKEN_ADDRESS  = "" //CONSTANT

const _encodeTransferFunction = (_account, t_to_stake) => {

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
    }, [_account, t_to_stake]);

    return toRet;
}



module.exports = async function(deployer) {
    const multiSigWallet = await IMultiSigWallet.at(MULTISIG_WALLET_ADDRESS)

    const _transferFromMultiSigTreasury = async (_account, _value) => {
        const result = await multiSigWallet.submitTransaction(
            MAIN_TOKEN_ADDRESS, 
            EMPTY_BYTES, 
            _encodeTransferFunction(_account, _value),
            0,
            {gas: 8000000}
        );
        txIndex = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
        await multiSigWallet.confirmTransaction(txIndex, {gas: 8000000});
        await multiSigWallet.executeTransaction(txIndex, {gas: 8000000});
    }

    await _transferFromMultiSigTreasury(TRANSFER_TO_ACCOUNT_PLACEHOLDER,T_TO_TRANSFER);
}