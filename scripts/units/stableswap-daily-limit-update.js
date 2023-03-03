const fs = require('fs');

const eventsHelper = require("../tests/helpers/eventsHelper");


const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");
const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);
const rawdataExternal = fs.readFileSync(constants.PATH_TO_ADDRESSES_EXTERNAL);
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
            constants.EMPTY_BYTES,
            _encodeUpdateDailySwapLimit(
                newdailySwapLimit
            ),0,{gas:8000000}
        )

        const tx = eventsHelper.getIndexedEventArgs(result, constants.SUBMIT_TRANSACTION_EVENT)[0];
        await multiSigWallet.confirmTransaction(tx, {gas: 8000000});
        await multiSigWallet.executeTransaction(tx, {gas: 8000000});

        let stableSwapDailyLimitUpdate = {
            stableSwapDailyLimitUpdateIdx: tx
        }

        let data = JSON.stringify(stableSwapDailyLimitUpdate)
        fs.writeFileSync(constants.PATH_TO_NEWLY_GENERATED_TRANSACTION_INDEX,data, function(err){
            if(err){
                console.log(err)
            }
        })
    }

    await _updateDailySwapLimit(DAILY_LIMIT)
}