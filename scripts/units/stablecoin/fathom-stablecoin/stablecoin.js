const fs = require('fs');


const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const STABLECOIN_ADDRESS = "0xa585BF9418C6Aca0a46d308Cea3b2EC85046C88F"

const  _encodeRenameFunction = (_name, _symbol) => {
    let toInitializeMainStream =  web3.eth.abi.encodeFunctionCall({
        name: 'rename',
        type: 'function',
        inputs: [{
            type: 'string',
            name: '_name'
        },
        {
            type: 'string',
            name: '_symbol'
        }]
        },  ["Subik", "Ji"]);

        return toInitializeMainStream
}


module.exports = async function(deployer) {
    await txnHelper.submitAndExecute(
        _encodeRenameFunction(
            "Subik",
            "Ji"
        ),
        STABLECOIN_ADDRESS,
        "stablecoinUpdateRename"
    )
}