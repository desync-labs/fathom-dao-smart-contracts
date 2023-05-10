//NOTE: This script can be run only once for each deployment as making COUNCIL_STAKES is only possible once
const fs = require('fs');

const constants = require('./helpers/constants')
const txnHelper = require('./helpers/submitAndExecuteTransaction')
const IStaking = artifacts.require('./dao/staking/interfaces/IStaking.sol');

const env = process.env.NODE_ENV || 'dev';
const addressesConfig = require(`../../config/config.${env}`)

const LOCK_PERIOD = 365 * 24 * 60 * 60;
//SET AS NEEDED
// this needs to be sum of all the stakes. Right now 10KK * 3. 
// NOT MAX UINT for security as its not good to approve max for Multisig
// This needs to be sum of all the staking position
const T_TOTAL_TO_APPROVE = web3.utils.toWei('10000000', 'ether');
// this is how much to stake for each council
const T_TO_STAKE_USER_1 = web3.utils.toWei('1000000', 'ether'); //set as needed
const T_TO_STAKE_USER_2 = web3.utils.toWei('1000000', 'ether'); //set as needed
const T_TO_STAKE_USER_3 = web3.utils.toWei('1000000', 'ether'); //set as needed
const T_TO_STAKE_USER_4 = web3.utils.toWei('1000000', 'ether'); //set as needed
const T_TO_STAKE_USER_5 = web3.utils.toWei('1000000', 'ether'); //set as needed
const T_TO_STAKE_USER_6 = web3.utils.toWei('1000000', 'ether'); //set as needed
const T_TO_STAKE_USER_7 = web3.utils.toWei('1000000', 'ether'); //set as needed
const T_TO_STAKE_USER_8 = web3.utils.toWei('1000000', 'ether'); //set as needed
const T_TO_STAKE_USER_9 = web3.utils.toWei('1000000', 'ether'); //set as needed
const T_TO_STAKE_USER_10 = web3.utils.toWei('1000000', 'ether'); //set as needed


// const USER_1 = addressesConfig.COUNCIL_1; //better to hardcode this
// const USER_2 = addressesConfig.COUNCIL_2; //better to hardcode this
// const USER_3 = addressesConfig.COUNCIL_3; //better to hardcode this

const USER_1 = "0x9a337088801B30a3eB715937BCDE27A34BC62841"
const USER_2 = "0xAD2c9625Fe6c88fcAf3E0D488543d51528d4a30D"
const USER_3 = "0x078D6d3e5b547D766e90078902ecC4C5AEf7a960"
const USER_4 = "0xa639856772F31f530AC0727Ec0f478a294aCfB21"
const USER_5 = "0x6f45f117f58A65AeE2F7F1aC53a22bAcC3d22ca0"
const USER_6 = "0x4db5B862AcD756D243dFD8168a14918681D6EDB4"
const USER_7 = "0xe8C7A3BCF6932E958dE77111CCfe853B1D7Cc7c5"
const USER_8 = "0xDd0A499401f710496f7663e97778AF364242cB3d"
const USER_9 = "0x5b5fC32Eb3e243A542684bCC09713Fb5f6f5E914"
const USER_10 = "0x35b176582819F2b5e70640624876927968904822"

const rawdata = fs.readFileSync(constants.PATH_TO_ADDRESSES);
const addresses = JSON.parse(rawdata);

const _createLockParamObject = (
    _amount,
    _lockPeriod,
    _account) => {
    return {
        amount: _amount,
        lockPeriod: _lockPeriod,
        account: _account
    }
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

const _encodeCreateLocksForCouncils = (_createLockParam) => {
    let toRet = web3.eth.abi.encodeFunctionCall({
        name:'createFixedLocksOnBehalfOfUserByAdmin',
        type:'function',
        inputs: [{
                type: 'tuple[]',
                name: 'lockPositions',
                components: [
                    {"type":"uint256", "name":"amount"},
                    {"type":"uint256", "name":"lockPeriod"},
                    {"type":"address", "name":"account"}
                ]
            }
        ]
    },[_createLockParam])
    return toRet
}

module.exports = async function(deployer) {
    const stakingService = await IStaking.at(addresses.staking);
    

    await txnHelper.submitAndExecute(
        _encodeApproveFunction(stakingService.address,T_TOTAL_TO_APPROVE),
        addresses.fthmToken,
        "ApproveFathomTxn"
    )
    
    const LockPositionForUser1 =  _createLockParamObject(T_TO_STAKE_USER_1,LOCK_PERIOD,USER_1)
    const LockPositionForUser2 =  _createLockParamObject(T_TO_STAKE_USER_2,LOCK_PERIOD,USER_2)
    const LockPositionForUser3 =  _createLockParamObject(T_TO_STAKE_USER_3,LOCK_PERIOD,USER_3)
    const LockPositionForUser4 =  _createLockParamObject(T_TO_STAKE_USER_4,LOCK_PERIOD,USER_4)
    const LockPositionForUser5 =  _createLockParamObject(T_TO_STAKE_USER_5,LOCK_PERIOD,USER_5)
    const LockPositionForUser6 =  _createLockParamObject(T_TO_STAKE_USER_6,LOCK_PERIOD,USER_6)
    const LockPositionForUser7 =  _createLockParamObject(T_TO_STAKE_USER_7,LOCK_PERIOD,USER_7)
    const LockPositionForUser8 =  _createLockParamObject(T_TO_STAKE_USER_8,LOCK_PERIOD,USER_8)
    const LockPositionForUser9 =  _createLockParamObject(T_TO_STAKE_USER_9,LOCK_PERIOD,USER_9)
    const LockPositionForUser10 =  _createLockParamObject(T_TO_STAKE_USER_10,LOCK_PERIOD,USER_10)
   
    const allLockPositions = [
        LockPositionForUser1,
        LockPositionForUser2,
        LockPositionForUser3,
        LockPositionForUser4,
        LockPositionForUser5,
        LockPositionForUser6,
        LockPositionForUser7,
        LockPositionForUser8,
        LockPositionForUser9,
        LockPositionForUser10
    ]
    
    await txnHelper.submitAndExecute(
        _encodeCreateLocksForCouncils(allLockPositions),
        stakingService.address,
        "createMultipleLocksForUsers"
    )
}