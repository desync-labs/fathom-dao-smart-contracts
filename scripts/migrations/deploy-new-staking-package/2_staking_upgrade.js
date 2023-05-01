const constants = require("../../tests/helpers/testConstants");
const eventsHelper = require("../../tests/helpers/eventsHelper");

const PackageStakingImplementation = artifacts.require('./dao/staking/packages/StakingPackage.sol');
const fs = require("fs");
const { EMPTY_BYTES } = require("../../tests/helpers/testConstants");
let env = process.env.NODE_ENV;
let addressesFilePath = `../../../addresses.${env}.json`;
const rawdata = fs.readFileSync(addressesFilePath);
const addresses = JSON.parse(rawdata);
const IMultiSigWallet = artifacts.require("./dao/treasury/interfaces/IMultiSigWallet.sol");

const MultisigWalletAddress = addresses.multiSigWallet;
const StakingProxyAddress = addresses.staking;
const StakingProxyAdminAddress = addresses.stakingProxyAdmin;
const SUBMIT_TRANSACTION_EVENT = constants.SUBMIT_TRANSACTION_EVENT

const _encodeUpgradeFunction = (_proxy, _impl) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'upgrade',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'proxy'
        },{
            type: 'address',
            name: 'implementation'
        }]
    }, [_proxy, _impl]);

    return toRet;
}

module.exports = async function(deployer) {
    const multiSigWallet = await IMultiSigWallet.at(MultisigWalletAddress)

    let resultUpgrade = await multiSigWallet.submitTransaction(
        StakingProxyAdminAddress,
        EMPTY_BYTES,
        _encodeUpgradeFunction(
            StakingProxyAddress,
            PackageStakingImplementation.address
        ),
        0,
        {gas: 8000000}
    )

    let txnIndexUpgrade = eventsHelper.getIndexedEventArgs(resultUpgrade, SUBMIT_TRANSACTION_EVENT)[0];
    await multiSigWallet.confirmTransaction(txnIndexUpgrade, {gas: 8000000});
    await multiSigWallet.executeTransaction(txnIndexUpgrade, {gas: 8000000});
}