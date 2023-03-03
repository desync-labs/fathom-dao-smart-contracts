const fs = require('fs');

const eventsHelper = require("../tests/helpers/eventsHelper");

const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);
//SET VALUE AS HOW MUCH ETH YOU WANT TO SPEND FOR THE WHOLE TRANSACTION(msg.value)
const value = constants.EMPTY_BYTES;

const _encodeProposalFunction = (
    _targets,
    _values,
    _calldatas,
    _descriptionHash
) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'propose',
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
            type: 'string',
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
    const DESCRIPTION_HASH = ''
    const multiSigWallet = await IMultiSigWallet.at(addresses.multiSigWallet);

    const encodedFunctionToCall = _encodedFucntionToCall()
    const CALLDATAS = [encodedFunctionToCall]
    const _proposeProposal = async(
        _targets,
        _values,
        _calldatas,
        _descriptionHash
    ) => {
        const result = await multiSigWallet.submitTransaction(
            addresses.fthmGovernor,
            value,
            _encodeProposalFunction(
                _targets,
                _values,
                _calldatas,
                _descriptionHash
            ),0,{gas:8000000}
        )
        const tx = eventsHelper.getIndexedEventArgs(result, constants.SUBMIT_TRANSACTION_EVENT)[0];
        await multiSigWallet.confirmTransaction(tx, {gas: 8000000});
        await multiSigWallet.executeTransaction(tx, {gas: 8000000});
    }

    await _proposeProposal(
        TARGETS,
        VALUES,
        CALLDATAS,
        DESCRIPTION_HASH
    )
}

