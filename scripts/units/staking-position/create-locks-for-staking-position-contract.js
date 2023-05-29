const fs = require('fs');
const constants = require('../helpers/constants')
const txnHelper = require('../helpers/submitAndExecuteTransaction')

const rawdataStakingPosition = fs.readFileSync(constants.PATH_TO_ADDRESSES_FOR_STAKING_POSITION_FOLDER);
const addressesStakingPosition = JSON.parse(rawdataStakingPosition);

const IStakingPositionContractFactory = artifacts.require("./dao/staking/staking-position/interfaces/IStakingPositionFactory.sol");

const env = process.env.NODE_ENV || 'demo';
const addressesFilePath = `../../../addresses.${env}.json`;
const rawdata = fs.readFileSync(addressesFilePath);
const addresses = JSON.parse(rawdata);

const ONE_YEAR = 31536000; // 365 days in seconds
const TWO_YEARS = 2 * ONE_YEAR;
const THREE_YEARS = 3 * ONE_YEAR;

const USER_TO_CREATE_LOCK_FOR = "0x9a337088801B30a3eB715937BCDE27A34BC62841"; // set as per needed
const AMOUNT_DESIRED_TO_LOCK = web3.utils.toWei('10000','ether'); // set as needed
const PERIOD_TO_LOCK = TWO_YEARS// set as needed

const _encodeCreateLockFunction = (_amount, _periodToLock) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'createLock',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: 'amount'
        },{
            type: 'uint256',
            name: 'periodToLock'
        }]
    }, [_amount, _periodToLock]);

    return toRet;
}

const _encodeApproveFunction = (_account, _amount) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'approve',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'spender'
        },{
            type: 'uint256',
            name: 'amount'
        }]
    }, [_account, _amount]);

    return toRet;
}

module.exports = async function(deployer) {
    const STAKING_POSITION_FACTORY_ADDRESS = addressesStakingPosition.StakingPositionFactory
    const FATHOM_TOKEN_ADDRESS = addresses.fthmToken
    
    const IStakingPositionFactory = await IStakingPositionContractFactory.at(
        STAKING_POSITION_FACTORY_ADDRESS
    )

    const STAKING_POSITION_CONTRACT_ADDRESS = await IStakingPositionFactory.getStakingPositionContractAddress(
        USER_TO_CREATE_LOCK_FOR
    )

    if(STAKING_POSITION_CONTRACT_ADDRESS == constants.NULL_ADDRESS) {
        console.log('address of staking position contract for user is null, something went wrong')
        return
    }

    await txnHelper.submitAndExecute(
        _encodeApproveFunction(STAKING_POSITION_CONTRACT_ADDRESS,AMOUNT_DESIRED_TO_LOCK),
        FATHOM_TOKEN_ADDRESS,
        "ApproveFathomTokenForStakingPositionFactory"
    )
    
    await txnHelper.submitAndExecute(
        _encodeCreateLockFunction(
            AMOUNT_DESIRED_TO_LOCK,
            PERIOD_TO_LOCK
        ),
        STAKING_POSITION_CONTRACT_ADDRESS,
        "CreateLockPositionForUser"
    )
}
