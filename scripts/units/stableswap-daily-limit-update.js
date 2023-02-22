const fs = require('fs');

const eventsHelper = require("../tests/helpers/eventsHelper");


const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");

const EMPTY_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000';
const SUBMIT_TRANSACTION_EVENT = "SubmitTransaction(uint256,address,address,uint256,bytes)";
const rawdata = fs.readFileSync('../../addresses.json');
const addresses = JSON.parse(rawdata);
const rawdataExternal = fs.readFileSync('../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);
const STABLE_SWAP_ADDRESS = addressesExternal.STABLE_SWAP_ADDRESS
//const STABLE_SWAP_ADDRESS = "" //SET
const DAILY_LIMIT = web3.utils.toWei('100000','ether') //SET


const _encodeUpdateDailySwapLimit = (newdailySwapLimit) =>{
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'setDailySwapLimit',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: 'newdailySwapLimit'
        }]
    }, [newdailySwapLimit]);

    return toRet;
}

module.exports = async function(deployer)  {
    const MULTISIG_WALLET_ADDRESS = addresses.multiSigWallet;
    const multiSigWallet = await IMultiSigWallet.at(MULTISIG_WALLET_ADDRESS);

    const _updateDailySwapLimit = async(
        newdailySwapLimit
    ) => {
        const result = await multiSigWallet.submitTransaction(
            STABLE_SWAP_ADDRESS,
            EMPTY_BYTES,
            _encodeUpdateDailySwapLimit(
                newdailySwapLimit
            ),0,{gas:8000000}
        )

        const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
        await multiSigWallet.confirmTransaction(tx, {gas: 8000000});
        await multiSigWallet.executeTransaction(tx, {gas: 8000000});
    }

    await _updateDailySwapLimit(DAILY_LIMIT)
}