const fs = require('fs');
const txnSaver = require('./helpers/transactionSaver')

const eventsHelper = require("../tests/helpers/eventsHelper");
const constants = require('./helpers/constants')

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);
//SET VALUE AS HOW MUCH ETH YOU WANT TO SPEND FOR THE WHOLE TRANSACTION(msg.value)
const value = constants.EMPTY_BYTES;

const _encodeQueueFunction = (
    _targets,
    _values,
    _calldatas,
    _descriptionHash
) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'queue',
        type: 'function',
        inputs: [{
            type: 'address[]',
            name: 'targets'
        },
        {
            type: 'uint256[]',
            name: 'values'
        },
        {
            type: 'bytes[]',
            name: 'calldatas'
        },
        {
            type: 'bytes32',
            name: 'descriptionHash'
        }]
    }, [_targets,
        _values,
        _calldatas,
        _descriptionHash]);

    return toRet;
}

const _encodedFucntionToCall = () => {
    let toRet= web3.eth.abi.encodeFunctionCall({
        name: '',
        type: '',
        input: [
            {}
        ]
    })

    return toRet
}
module.exports = async function(deployer) {
    //What are the targets to propose to
    const TARGETS = []
    // What are the values that each target interaction needs. (msg.value for each transaction)
    const VALUES = []
    // Calldatas: The function you want to call should be encoded
    
    // Description
    const DESCRIPTION_HASH_STRING = ''//note bytes32
    const DESCRIPTION_HASH = web3.utils.keccak256(DESCRIPTION_HASH_STRING)
    const multiSigWallet = await IMultiSigWallet.at(addresses.multiSigWallet);

    const encodedFunctionToCall = _encodedFucntionToCall()
    const CALLDATAS = [encodedFunctionToCall]
    const _queueProposal = async(
        _targets,
        _values,
        _calldatas,
        _descriptionHash
    ) => {
        const result = await multiSigWallet.submitTransaction(
            addresses.fthmGovernor,
            value,
            _encodeQueueFunction(
                _targets,
                _values,
                _calldatas,
                _descriptionHash
            ),0,{gas:8000000}
        )
        const tx = eventsHelper.getIndexedEventArgs(result, constants.SUBMIT_TRANSACTION_EVENT)[0];
        await multiSigWallet.confirmTransaction(tx, {gas: 8000000});
        await multiSigWallet.executeTransaction(tx, {gas: 8000000});
            
        await txnSaver.saveTxnIndex("queueProposalTxn", tx)   
    }

    await _queueProposal(
        TARGETS,
        VALUES,
        CALLDATAS,
        DESCRIPTION_HASH
    )
}

