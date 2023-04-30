const fs = require('fs');
const constants = require('../helpers/constants')

const txnHelper = require('../helpers/submitAndExecuteTransaction')
const IStakingPositionContractFactory = artifacts.require("./dao/staking/staking-position/interfaces/IStakingPositionFactory.sol");

const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES_FOR_STAKING_POSITION_FOLDER);

const addressesStakingPosition = JSON.parse(rawdata);
const USER_TO_CREATE_STAKING_CONTRACT_FOR = "0x2B3691065A78F5fb02E9BF54A197b95da2B26AF7"; // set as per needed

const _encodeCreateStakingPositionContract = (_account) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'createStakingPositionContract',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_account'
        }
    ]
    }, [_account]);

    return toRet;
}  

module.exports = async function(deployer) {
    const STAKING_POSITION_FACTORY_ADDRESS = addressesStakingPosition.StakingPositionFactory
    await txnHelper.submitAndExecute(
        _encodeCreateStakingPositionContract(USER_TO_CREATE_STAKING_CONTRACT_FOR),
        STAKING_POSITION_FACTORY_ADDRESS,
        "createStakingPositionContract"
    )
    
    const IStakingPositionFactory = await IStakingPositionContractFactory.at(
        STAKING_POSITION_FACTORY_ADDRESS
    )

    const addressOfStakingPositionContractForUser = await IStakingPositionFactory.getStakingPositionContractAddress(
        USER_TO_CREATE_STAKING_CONTRACT_FOR
    )

    if(addressOfStakingPositionContractForUser == constants.NULL_ADDRESS) {
        console.log('address of staking position contract for user is null, something went wrong')
        return
    }
    
    let env = process.env.NODE_ENV || 'demo';
    let filePath = `./addresses.staking-contracts-of-users.${env}.json`;

    if (fs.existsSync(filePath)) {
        // File exists, add new address to it
        let existingData = fs.readFileSync(filePath);
        let existingAddresses = JSON.parse(existingData);

        existingAddresses[USER_TO_CREATE_STAKING_CONTRACT_FOR] = {
            StakingPositionContract: addressOfStakingPositionContractForUser
        };
        let data = JSON.stringify(existingAddresses, null, " ");
        fs.writeFileSync(filePath, data);
    } else {
        let existingAddresses = {}
        existingAddresses[USER_TO_CREATE_STAKING_CONTRACT_FOR] = {
            StakingPositionContract: addressOfStakingPositionContractForUser
        };
        let data = JSON.stringify(existingAddresses, null, " ");
        // File doesn't exist, create it with new address
        fs.writeFileSync(filePath, data);
    }
}