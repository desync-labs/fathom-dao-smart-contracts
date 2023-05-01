const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const BN = web3.utils.BN
const chai = require("chai");
const { expect } = chai.use(require('chai-bn')(BN));
const eventsHelper = require("../../helpers/eventsHelper");
const blockchain = require("../../helpers/blockchain");
const constants = require("../../helpers/testConstants");

const maxGasForTxn = 600000
const {
    shouldRevert,
    errTypes,
    shouldRevertAndHaveSubstring
} = require('../../helpers/expectThrow');

const SYSTEM_ACC = accounts[0];
const staker_1 = accounts[1];

const staker_2 = accounts[4];
const staker_3 = accounts[5];
const staker_4 = accounts[6];
const staker_5 = accounts[7];
const stream_manager = accounts[7];
const stream_rewarder_1 = accounts[8];
const stream_rewarder_2 = accounts[9];
const percentToTreasury = 50;
const EMPTY_BYTES = constants.EMPTY_BYTES;
// event
const SUBMIT_TRANSACTION_EVENT = constants.SUBMIT_TRANSACTION_EVENT


const _getTimeStamp = async () => {
    const timestamp = await blockchain.getLatestBlockTimestamp()
    return timestamp
}
const _calculateNumberOfVFTHM = (sumToDeposit, lockingPeriod, lockingWeight) =>{
    const lockingPeriodBN = new web3.utils.BN(lockingPeriod);
    const lockingWeightBN = new web3.utils.BN(lockingWeight);
    const sumToDepositBN = new web3.utils.BN(sumToDeposit);
    
    return sumToDepositBN.mul(lockingPeriodBN).div(lockingWeightBN);
}

const _calculateNumberOfStreamShares = (sumToDeposit, vMainTokenCoefficient, nVFTHM, maxWeightShares) => {
    const sumToDepositBN = new web3.utils.BN(sumToDeposit);
    const vMainTokenWeightBN = new web3.utils.BN(vMainTokenCoefficient); 
    const maxWeightBN = new web3.utils.BN(maxWeightShares);
    const oneThousandBN = new web3.utils.BN(1000)
    return (sumToDepositBN.add(vMainTokenWeightBN.mul(nVFTHM).div(oneThousandBN))).mul(maxWeightBN)
}

const _calculateRemainingBalance = (depositAmount, beforeBalance) => {
    const depositAmountBN = new web3.utils.BN(depositAmount);
    const beforeBalanceBN = new web3.utils.BN(beforeBalance)
    return beforeBalanceBN.sub(depositAmountBN)
}

const _convertToEtherBalance = (balance) => {
    return parseFloat(web3.utils.fromWei(balance,"ether").toString()).toFixed(5)
}

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

const _encodeGrantRole = (role, account) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'grantRole',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: 'role'
        },{
            type: 'address',
            name: 'account'
        }]
    }, [role, account]);

    return toRet;
}

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

const _encodeUpdateVault = (_vault) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'updateVault',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_vault'
        }]
    }, [_vault]);

    return toRet;
}

const _encodeMigrate = (_newVaultPackage) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'migrate',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'newVaultPackage'
        }]
    }, [_newVaultPackage]);

    return toRet;
}

const _encodeAddSupportedTokenFunction = (_token) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'addSupportedToken',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_token'
        }]
    }, [_token]);

    return toRet;
}

const _encodeAdminPause = (flag) => {
    let toRet = web3.eth.abi.encodeFunctionCall({
        name: 'adminPause',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: 'flags'
        }]}, [flag]);

    return toRet;
}

const _encodeProposeStreamFunction = (
    _owner,
    _rewardToken,
    _percentToTreasury,
    _maxDepositedAmount,
    _minDepositedAmount,
    _scheduleTimes,
    _scheduleRewards,
    _tau
) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'proposeStream',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'streamOwner'
        },{
            type: 'address',
            name: 'rewardToken'
        },
        ,{
            type: 'uint256',
            name: 'percentToTreasury'
        },{
            type: 'uint256',
            name: 'maxDepositAmount'
        },{
            type: 'uint256',
            name: 'minDepositAmount'
        },{
            type: 'uint256[]',
            name: 'scheduleTimes'
        },{
            type: 'uint256[]',
            name: 'scheduleRewards'
        },{
            type: 'uint256',
            name: 'tau'
        }]
    }, [
        _owner,
        _rewardToken,
        _percentToTreasury,
        _maxDepositedAmount,
        _minDepositedAmount,
        _scheduleTimes,
        _scheduleRewards,
        _tau
    ]);

    return toRet;
}

const _encodeCreateLockWithoutEarlyWithdrawal = (_createLockParam) => {
    // encoded transfer function call for staking on behalf of someone else from treasury.
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

const _encodeStakeApproveFunction = (amount, spender) => {
    // approve(address spender, uint256 amount)
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
    }, [spender, amount]);

    return toRet;
}


describe("Staking Test, Upgrade Test and Emergency Scenarios", () => {

    const oneYear = 31556926;
    let stakingService;
    let vaultService;
    let stakingGetterService;
    let FTHMToken;
    let vMainToken;
    let stakingUpgrade;
    let vaultUpgrade;
    let multiSigWallet;
    let streamReward1;
    let streamReward2;

    let streamReward1Address;
    let streamReward2Address;

    let maxWeightShares;
    let minWeightShares;
    let maxWeightPenalty;
    let minWeightPenalty;
    let vMainTokenCoefficient;
    let lockingVoteWeight;
    let rewardsCalculator;
    let proxyAddress;
    let vaultProxyAdmin;
    let stakingProxyAdmin;
    let vaultMigrateService;
    let snapshotToRevertTo;
    
    const sumToDeposit = web3.utils.toWei('100', 'ether');
    const sumToTransfer = web3.utils.toWei('2000', 'ether');
    const sumToApprove = web3.utils.toWei('2000','ether');
    const sumForProposer = web3.utils.toWei('20000','ether')
    const vMainTokensToApprove = web3.utils.toWei('500000', 'ether')

    before(async() => {
        await snapshot.revertToSnapshot();
        maxWeightShares = 1024;
        minWeightShares = 256;
        maxWeightPenalty = 3000;
        minWeightPenalty = 100;
        weightMultiplier = 10;
        maxNumberOfLocks = 10;
        _flags = 0;
        
        //this is used for stream shares calculation.
        vMainTokenCoefficient = 500;
        //this is used for calculation of release of voteToken
        lockingVoteWeight = 365 * 24 * 60 * 60;
        
        stakingService = await artifacts.initializeInterfaceAt(
            "IStaking",
            "StakingProxy"
        )

        vaultService = await artifacts.initializeInterfaceAt(
            "IVault",
            "VaultProxy"
        )
        stakingGetterService = await artifacts.initializeInterfaceAt(
            "StakingGettersHelper",
            "StakingGettersHelper"
        )

        rewardsCalculator = await artifacts.initializeInterfaceAt(
            "RewardsCalculator",
            "RewardsCalculator"
        )

        stakingUpgrade = await artifacts.initializeInterfaceAt(
            "StakingUpgrade",
            "StakingUpgrade"
        )

        vaultUpgrade = await artifacts.initializeInterfaceAt(
            "VaultUpgrade",
            "VaultUpgrade"
        )

        vaultProxyAdmin = await artifacts.initializeInterfaceAt(
            "VaultProxyAdmin",
            "VaultProxyAdmin"
        )

        stakingProxyAdmin = await artifacts.initializeInterfaceAt(
            "StakingProxyAdmin",
            "StakingProxyAdmin"
        )

        vaultMigrateService = await artifacts.initializeInterfaceAt(
            "IVault",
            "VaultProxyMigrate"
        )

        FTHMToken = await artifacts.initializeInterfaceAt("MainToken","MainToken");
        streamReward1 = await artifacts.initializeInterfaceAt("ERC20Rewards1","ERC20Rewards1");
        streamReward2 = await artifacts.initializeInterfaceAt("ERC20Rewards2","ERC20Rewards2");
        multiSigWallet = await artifacts.initializeInterfaceAt("MultiSigWallet", "MultiSigWallet");
        
        await streamReward1.transfer(stream_rewarder_1,web3.utils.toWei("10000","ether"),{from: SYSTEM_ACC});
        await streamReward2.transfer(stream_rewarder_2,web3.utils.toWei("10000","ether"),{from: SYSTEM_ACC});
        
        vMainToken = await artifacts.initializeInterfaceAt("VMainToken", "VMainToken");

        vMainTokenAddress = vMainToken.address;
        FTHMTokenAddress = FTHMToken.address;
        streamReward1Address = streamReward1.address;
        streamReward2Address = streamReward2.address;

        const _transferFromMultiSigTreasury = async (_account, _value) => {
            const result = await multiSigWallet.submitTransaction(
                FTHMToken.address, 
                EMPTY_BYTES, 
                _encodeTransferFunction(_account, _value),
                0,
                {"from": accounts[0]}
            );
            txIndex4 = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];

            await multiSigWallet.confirmTransaction(txIndex4, {"from": accounts[0]});
            await multiSigWallet.confirmTransaction(txIndex4, {"from": accounts[1]});

            await multiSigWallet.executeTransaction(txIndex4, {"from": accounts[1]});
        }

        console.log(".........Transferring tokens from Treasury to accounts.........");

        await _transferFromMultiSigTreasury(SYSTEM_ACC, sumToTransfer);
        await _transferFromMultiSigTreasury(staker_1, sumToTransfer);
        await _transferFromMultiSigTreasury(staker_2, sumToTransfer);
        await _transferFromMultiSigTreasury(staker_3, sumToTransfer);
        await _transferFromMultiSigTreasury(staker_4, sumToTransfer);
        await _transferFromMultiSigTreasury(stream_manager, sumForProposer);
        
        await vMainToken.approve(stakingService.address, vMainTokensToApprove, {from: SYSTEM_ACC})

        const _addSupportedTokenFromMultiSigTreasury = async (_token) => {
            const result = await multiSigWallet.submitTransaction(
                vaultService.address, 
                EMPTY_BYTES, 
                _encodeAddSupportedTokenFunction(_token),
                0,
                {"from": accounts[0]}
            );
            const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];

            await multiSigWallet.confirmTransaction(tx, {"from": accounts[0]});
            await multiSigWallet.confirmTransaction(tx, {"from": accounts[1]});

            await multiSigWallet.executeTransaction(tx, {"from": accounts[1]});
        }

        console.log(".........Adding rewards tokens to treasury.........");

        await _addSupportedTokenFromMultiSigTreasury(streamReward1Address);
        await _addSupportedTokenFromMultiSigTreasury(streamReward2Address);
    });

    describe('Creating Locks and Unlocking before any stream reward tokens are issued, and release vote token', async() => {
        expectedTotalAmountOfVFTHM = new web3.utils.BN(0)
        it('Should create a lock possition with lockId = 1 for staker_1', async() => {
            // So that staker 1 can actually stake the token:
            await FTHMToken.approve(stakingService.address, sumToApprove, {from: staker_1})
            const beforeFTHMBalance = await FTHMToken.balanceOf(staker_1);

            await blockchain.increaseTime(20);
            let lockingPeriod = 365 * 24 * 60 * 60;

            const unlockTime = lockingPeriod;
            console.log(".........Creating a Lock Position for staker 1.........");

            let result = await stakingService.createLock(sumToDeposit,unlockTime,{from: staker_1});
            // Since block time stamp can change after locking, we record the timestamp, 
            // later to be used in the expectedNVFTHM calculation.  
            // This mitigates an error created from the slight change in block time.
            
            const expectedFTHMBalanceStaker1 = _calculateRemainingBalance(sumToDeposit, beforeFTHMBalance.toString())
            const afterFTHMBalance = await FTHMToken.balanceOf(staker_1);
            

            let eventArgs = eventsHelper.getIndexedEventArgs(result, "Staked(address,uint256,uint256,uint256,uint256,uint256)");
            const expectedLockId = 1
            console.log(".........Total Staked Protocol Token Amount for Lock Position ", _convertToEtherBalance(sumToDeposit));
            assert.equal(eventArgs[1].toString(),expectedLockId)
            assert.equal(afterFTHMBalance.toString(),expectedFTHMBalanceStaker1.toString())

            const expectedNVFTHM = _calculateNumberOfVFTHM(sumToDeposit, lockingPeriod, lockingVoteWeight)
            expectedTotalAmountOfVFTHM = expectedTotalAmountOfVFTHM.add(expectedNVFTHM)

            const staker1VeTokenBal = (await vMainToken.balanceOf(staker_1)).toString()

            //  Here we check that the correct amount of vote was minted.
            staker1VeTokenBal.should.be.bignumber.equal(expectedNVFTHM)
            console.log(
                ".........Released VOTE tokens to staker 1 based upon locking period (1 year) and locking amount  (100 Protocol Tokens) ",
                _convertToEtherBalance(staker1VeTokenBal),
                'VOTE Tokens'
            )
        });
        
        it("Should create a second lock possition for staker_1, and check that correct number of vote tokens are released", async() => {
            await blockchain.increaseTime(20);
            let lockingPeriod = 365 * 24 * 60 * 60 / 2;
            
            const unlockTime = lockingPeriod;
            console.log(".........Creating a second Lock Position for staker 1.........");
            let result = await stakingService.createLock(sumToDeposit, unlockTime, {from: staker_1, gas:maxGasForTxn}); //staker_1 creates a lock position - 1
            
            let eventArgs = eventsHelper.getIndexedEventArgs(result, "Staked(address,uint256,uint256,uint256,uint256,uint256)");
            const lockInfo = await stakingGetterService.getLockInfo(staker_1,2)
            const actualNVFTHM = web3.utils.toBN(lockInfo.amountOfVoteToken.toString())
            
            //lockingVoteWeight = 365 * 24 * 60 * 60;
            const expectedNVFTHM = _calculateNumberOfVFTHM(sumToDeposit, lockingPeriod, lockingVoteWeight)
            console.log(".........Total Staked Protocol Token Amount for Lock Position ", _convertToEtherBalance(sumToDeposit));
            const expectedShares = _calculateNumberOfStreamShares(sumToDeposit, vMainTokenCoefficient, actualNVFTHM, maxWeightShares);
            const actualShares = web3.utils.toBN(lockInfo.positionStreamShares.toString())
            
            actualNVFTHM.should.be.bignumber.equal(expectedNVFTHM)
            actualShares.should.be.bignumber.equal(expectedShares)
            expectedTotalAmountOfVFTHM = expectedTotalAmountOfVFTHM.add(expectedNVFTHM)
            console.log(".........Released VOTE tokens to staker 1 based upon locking period ( 1/2 year )and locking amount (100 Protocol Tokens) ",_convertToEtherBalance(expectedNVFTHM), 'VOTE Tokens')
        })

        it("Should have correct total number of staked protocol tokens", async() => {
            //2 deposits:
            const sumToDepositBN = new web3.utils.BN(sumToDeposit);
            const expectedTotalAmountOfStakedFTHM = sumToDepositBN.add(sumToDepositBN);
            let result = await stakingService.totalAmountOfStakedToken()
            const totalAmountOfStakedToken = result;
            assert.equal(totalAmountOfStakedToken.toString(),expectedTotalAmountOfStakedFTHM.toString())
            console.log(".........Total Amount Of Staked Protocol Token ", _convertToEtherBalance(totalAmountOfStakedToken.toString()))
        })

        it("Setup a lock position for Staker 2  and Staker 3", async() => {
            const unlockTime =  500;
            const expectedLockId = 1
            
            const sumToDepositForAll = web3.utils.toWei('0.11', 'ether');

            await FTHMToken.approve(stakingService.address, sumToApprove, {from: staker_2})
            await FTHMToken.approve(stakingService.address, sumToApprove, {from: staker_3})
            
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            console.log(".........Creating a Lock Position for staker 2 and Staker 3.......");
            let result1 = await stakingService.createLock(sumToDepositForAll,unlockTime, {from: staker_2}); //staker_2 creates a lock position - 1
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            let result2 = await stakingService.createLock(sumToDepositForAll,unlockTime,{from: staker_3}); //staker_3 creates a lock position - 1
            await blockchain.mineBlock(await _getTimeStamp() + 20);

            let eventArgs1 = eventsHelper.getIndexedEventArgs(result1, "Staked(address,uint256,uint256,uint256,uint256,uint256)");
            let eventArgs2 = eventsHelper.getIndexedEventArgs(result2, "Staked(address,uint256,uint256,uint256,uint256,uint256)");
            
            // Check that the lock id is being assigned correctly.  For each staker, their first respective lockId is 1
            assert.equal(eventArgs1[1].toString(),expectedLockId)
            assert.equal(eventArgs2[1].toString(),expectedLockId)
        })
        

        it("Should not unlock locked position before the end of the lock position's lock period - staker_1", async() => {
            
            const errorMessage = "revert";

            await shouldRevertAndHaveSubstring(
                stakingService.unlock(1, {from: staker_1}),
                errTypes.revert,  
                errorMessage
            );
            //  staker_1 would have to use the function earlyUnlock() to unlock before the lock period has passed.
        })

        it("Should completely unlock LockId = 1 - staker_1, replace LockId 1 with LockId 2 in the locks array for staker_1", async() => {
            // The lock array for staker_1 should reduce in length by 1 on the backend.
            const mineTimestamp = 365 * 24 * 60 * 60;
            await blockchain.mineBlock(await _getTimeStamp() + mineTimestamp);
            console.log(".........Unlocking lock position - 1 of Staker_1.......")
            console.log("balance of FTHM Token before unlock: ",(await FTHMToken.balanceOf(staker_1)).toString())
            await stakingService.unlock(1, {from : staker_1});
            console.log(".........Unlocking All The Lock Positions created till Now..........")
        })

        it('Approve FATHOM tokens to staking contracy', async() => {
            const approveAmount = web3.utils.toWei('800000', 'ether');

            const _approve = async (
                _amount,
                _spender
            ) => {
                const result = await multiSigWallet.submitTransaction(
                    FTHMToken.address,
                    EMPTY_BYTES, 
                    _encodeStakeApproveFunction(_amount, _spender),
                    0,
                    {"from": accounts[0]}
                );
                const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[0]});
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[1]});
    
                await multiSigWallet.executeTransaction(tx, {"from": accounts[1]});
            }
            
            await _approve(
                approveAmount,
                stakingService.address
            )
        })
        it('Should create early unwithdrawable lock position for staker_1, staker_2', async() => {
            const oneYr = 365 * 24 * 60 * 60;
            const amount = web3.utils.toWei('200000', 'ether');
            
            const lockPositionForCommityOne = _createLockParamObject(amount,oneYr,staker_2) //staker_2 creates a lock position - 2
            const lockPositionForCommityTwo =  _createLockParamObject(amount,oneYr,staker_3) //staker_3 creates a lock position - 2
            const allLockPositions = [lockPositionForCommityOne, lockPositionForCommityTwo]

            const _createLockWithoutEarlyWithdrawal = async(
                lockParamObject
            ) => {
                const result = await multiSigWallet.submitTransaction(
                    stakingService.address,
                    EMPTY_BYTES,
                    _encodeCreateLockWithoutEarlyWithdrawal(
                        lockParamObject
                    ),
                    0,
                    {"from": accounts[0]}
                )

                const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[0]});
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[1]});
    
                await multiSigWallet.executeTransaction(tx, {"from": accounts[1]});
            }
            await blockchain.mineBlock(await _getTimeStamp() + 100)
            await _createLockWithoutEarlyWithdrawal(allLockPositions);
            await blockchain.mineBlock(await _getTimeStamp() + 100)
        })

        it('Should create another early unwithrawable lock position for staker_1, staker_2', async() => {
            const oneYr = 365 * 24 * 60 * 60;
            const amount = web3.utils.toWei('200000', 'ether');
            
            
            const lockPositionForCommityOne = _createLockParamObject(amount,oneYr,staker_2) //staker_2 creates a lock position - 3
            const lockPositionForCommityTwo =  _createLockParamObject(amount,oneYr,staker_3) //staker_3 creates a lock position - 3
            const allLockPositions = [lockPositionForCommityOne, lockPositionForCommityTwo]

            const _createLockWithoutEarlyWithdrawal = async(
                lockParamObject
            ) => {
                const result = await multiSigWallet.submitTransaction(
                    stakingService.address,
                    EMPTY_BYTES,
                    _encodeCreateLockWithoutEarlyWithdrawal(
                        lockParamObject
                    ),
                    0,
                    {"from": accounts[0]}
                )

                const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[0]});
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[1]});
    
                await multiSigWallet.executeTransaction(tx, {"from": accounts[1]});
            }
            await blockchain.mineBlock(await _getTimeStamp() + 100)
            await _createLockWithoutEarlyWithdrawal(allLockPositions);
            await blockchain.mineBlock(await _getTimeStamp() + 100)
        })

        it("Should Revert: early unlock not possible staker_2 - lock position -2,3", async() => {
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            const errorMessage = "revert";

            await shouldRevertAndHaveSubstring(
                stakingService.earlyUnlock(2, {from: staker_2}),
                errTypes.revert, 
                errorMessage
            );

            await blockchain.mineBlock(await _getTimeStamp() + 20);

            await shouldRevertAndHaveSubstring(
                stakingService.earlyUnlock(3, {from: staker_2}),
                errTypes.revert, 
                errorMessage
            );
            
        })

        it("Should Revert: early unlock not possible - staker_3 - lock position 2,-3", async() => {
            
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            const errorMessage = "revert";

            await shouldRevertAndHaveSubstring(
                stakingService.earlyUnlock(2, {from: staker_3}),
                errTypes.revert, 
                errorMessage
            );

            await blockchain.mineBlock(await _getTimeStamp() + 20);

            await shouldRevertAndHaveSubstring(
                stakingService.earlyUnlock(3, {from: staker_3}),
                errTypes.revert, 
                errorMessage
            );
        })

        it('Should not claim rewards for early unlock - staker - 2', async() => {
            const MAIN_STREAM_ID = 0
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            await stakingService.withdrawAllStreams({from: staker_2})
            const mineSixMonthsToCheckIfRewardsCouldBeClaimed = 6 * 30 * 24 * 60 * 60;
            await blockchain.mineBlock(await _getTimeStamp() + mineSixMonthsToCheckIfRewardsCouldBeClaimed);
            await stakingService.claimAllStreamRewardsForLock(2,{from: staker_2})
            await stakingService.claimAllStreamRewardsForLock(3,{from: staker_2})
            const userPendingRewardsShouldBeZeroAfterClaim = await stakingService.getUsersPendingRewards(staker_2,MAIN_STREAM_ID)
            assert.equal(userPendingRewardsShouldBeZeroAfterClaim.toString(), "0")
        })

        it('Should not claim rewards for early unlock - staker - 3', async() => {
            const MAIN_STREAM_ID = 0
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            await stakingService.withdrawAllStreams({from: staker_3})
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            await stakingService.claimAllStreamRewardsForLock(2,{from: staker_3})
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            await stakingService.claimAllStreamRewardsForLock(3,{from: staker_3})
            const userPendingRewardsShouldBeZeroAfterClaim = await stakingService.getUsersPendingRewards(staker_3,MAIN_STREAM_ID)
            assert.equal(userPendingRewardsShouldBeZeroAfterClaim.toString(), "0")
        })

        it("Should be able to claim after lock period expires - staker_2", async() => {
            const MAIN_STREAM_ID = 0
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            const mineEightMonthsToCheckIfRewardsCouldBeClaimed = 8 * 30 * 24 * 60 * 60;
            await blockchain.mineBlock(await _getTimeStamp() + mineEightMonthsToCheckIfRewardsCouldBeClaimed);
            await stakingService.claimAllStreamRewardsForLock(2,{from: staker_2})
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            await stakingService.claimAllStreamRewardsForLock(3,{from: staker_2})
            const userPendingRewardsShouldBeMoreThanZeroAfterClaim = await stakingService.getUsersPendingRewards(staker_2,MAIN_STREAM_ID)
            console.log("usersPendingRewards: ", _convertToEtherBalance(userPendingRewardsShouldBeMoreThanZeroAfterClaim.toString()));
        })

        it("Should be able to claim after lock period expires - staker_3", async() => {
            const MAIN_STREAM_ID = 0
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            const mineOneMoreMonthToCheckIfRewardsCouldBeClaimed = 1 * 30 * 24 * 60 * 60;
            await blockchain.mineBlock(await _getTimeStamp() + mineOneMoreMonthToCheckIfRewardsCouldBeClaimed);
            await stakingService.claimAllStreamRewardsForLock(2,{from: staker_3})
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            await stakingService.claimAllStreamRewardsForLock(3,{from: staker_3})
            const userPendingRewardsShouldBeMoreThanZeroAfterClaim = await stakingService.getUsersPendingRewards(staker_3,MAIN_STREAM_ID)
            console.log("usersPendingRewards: ", _convertToEtherBalance(userPendingRewardsShouldBeMoreThanZeroAfterClaim.toString()));
        })

        it('Should upgrade Staking by mulitsig and call new function getLockInfo', async() => {
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            const _proposeUpgrade = async (
                _proxy,
                _impl
            ) => {
                const result = await multiSigWallet.submitTransaction(
                    stakingProxyAdmin.address, 
                    EMPTY_BYTES, 
                    _encodeUpgradeFunction(
                        _proxy,
                        _impl
                    ),
                    0,
                    {"from": accounts[0]}
                );
                const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[0]});
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[1]});
    
                await multiSigWallet.executeTransaction(tx, {"from": accounts[1]});
            }
            const StakingUpgrade = artifacts.require('./dao/test/staking/upgrades/StakingUpgrade.sol');
            await _proposeUpgrade(
                stakingService.address,
                stakingUpgrade.address
            )
            
            stakingService = await StakingUpgrade.at(stakingService.address)
            //getLockInfo New function added to StakingUpgrade.
            console.log((await stakingService.getLockInfo(staker_1,1)).toString())
            await blockchain.mineBlock(await _getTimeStamp() + 20);
        })

        it('Should upgrade Vault by mulitsig and call new function getSupportedToken', async() => {
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            const _proposeUpgrade = async (
                _proxy,
                _impl
            ) => {
                const result = await multiSigWallet.submitTransaction(
                    vaultProxyAdmin.address, 
                    EMPTY_BYTES, 
                    _encodeUpgradeFunction(
                        _proxy,
                        _impl
                    ),
                    0,
                    {"from": accounts[0]}
                );
                const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[0]});
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[1]});
    
                await multiSigWallet.executeTransaction(tx, {"from": accounts[1]});
            }
            const VaultUpgrade = artifacts.require('./dao/test/staking/upgrades/VaultUpgrade.sol');
            await _proposeUpgrade(
                vaultService.address,
                vaultUpgrade.address
            )
            
            vaultService = await VaultUpgrade.at(vaultService.address)
            console.log((await vaultService.getIsSupportedToken(FTHMToken.address)).toString())
            await blockchain.mineBlock(await _getTimeStamp() + 20);
        })
        
        it("Should unlock completely locked positions for user - staker_2", async() => {
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            await stakingService.unlock(1, {from: staker_2});
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            await stakingService.unlock(1, {from: staker_2});
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            await stakingService.unlock(1, {from: staker_2});
            await blockchain.mineBlock(await _getTimeStamp() + 20);
        }) 
        
        it("Should unlock completely locked positions for user - staker_3", async() => {
            await stakingService.unlock(1, {from: staker_3});
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            await stakingService.unlock(1, {from: staker_3});
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            await stakingService.unlock(1, {from: staker_3});
        });


        

        it("Should unlock completely for locked position 1 - staker_1", async() => {
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            await stakingService.unlock(1, {from: staker_1});
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            const totalAmountOfStakedToken = await stakingService.totalAmountOfStakedToken()
            const totalAmountOfStreamShares = await stakingService.totalStreamShares()
            assert.equal(totalAmountOfStakedToken.toString(),"0")
            assert.equal(totalAmountOfStreamShares.toString(),"0")
            console.log(".........After all the locks are completely unlocked.........")
            console.log(".........total amount of Staked Protocol Tokens Amount: ", totalAmountOfStakedToken.toString());
            console.log(".........total Amount Of Stream Shares: ", totalAmountOfStreamShares.toString());
        });
        

        
    });
    
    describe('Creating Streams and Rewards Calculations', async() => {
        it("Should propose first stream, stream - 1", async() => {
            console.log("A protocol wanting to collaborate with us, proposes a stream")
            console.log("They provide us their native tokens that they want to distribute to the community")
            console.log(".........Creating a Proposal for a stream..........")
            const maxRewardProposalAmountForAStream = web3.utils.toWei('1000', 'ether');
            const minRewardProposalAmountForAStream = web3.utils.toWei('200', 'ether');
            
            const startTime = await _getTimeStamp() + 20;
            const scheduleRewards = [
                web3.utils.toWei('1000', 'ether'),
                web3.utils.toWei("0", 'ether')
            ];
            
            const scheduleTimes = [
                startTime,
                startTime + oneYear
            ];

            const _proposeStreamFromMultiSigTreasury = async (
                _stream_rewarder_1,
                _streamReward1Address,
                _percentToTreasury,
                _maxRewardProposalAmountForAStream,
                _minRewardProposalAmountForAStream,
                _scheduleTimes,
                _scheduleRewards,
                _tau
            ) => {
                const result = await multiSigWallet.submitTransaction(
                    stakingService.address, 
                    EMPTY_BYTES, 
                    _encodeProposeStreamFunction(
                        _stream_rewarder_1,
                        _streamReward1Address,
                        _percentToTreasury,
                        _maxRewardProposalAmountForAStream,
                        _minRewardProposalAmountForAStream,
                        _scheduleTimes,
                        _scheduleRewards,
                        _tau
                    ),
                    0,
                    {"from": accounts[0]}
                );
                const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[0]});
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[1]});
    
                await multiSigWallet.executeTransaction(tx, {"from": accounts[1]});
            }
    
            await _proposeStreamFromMultiSigTreasury(
                stream_rewarder_1,
                streamReward1Address,
                percentToTreasury,
                maxRewardProposalAmountForAStream,
                minRewardProposalAmountForAStream,
                scheduleTimes,
                scheduleRewards,
                10
            );

            await blockchain.mineBlock(await _getTimeStamp() + 10)
        })

        it("Should Create a Stream - 1", async() => {
            const streamId = 1
            console.log(".........Creating the stream proposed.........")
            console.log("Once create stream is called, the proposal will become live once start time is reached")
            const RewardProposalAmountForAStream = web3.utils.toWei('1000', 'ether');
            await streamReward1.approve(stakingService.address, RewardProposalAmountForAStream, {from:stream_rewarder_1})
            await stakingService.createStream(streamId,RewardProposalAmountForAStream, {from: stream_rewarder_1});
        })

        it("Should grant admin role to accounts[0] and withdraw extra supported tokens", async() =>{
            const _grantRoleMultisig = async (_role, _account) => {
                const result = await multiSigWallet.submitTransaction(
                    vaultService.address, 
                    EMPTY_BYTES, 
                    _encodeGrantRole(_role, _account),
                    0,
                    {"from": accounts[0]}
                );
                txIndex4 = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    
                await multiSigWallet.confirmTransaction(txIndex4, {"from": accounts[0]});
                await multiSigWallet.confirmTransaction(txIndex4, {"from": accounts[1]});
    
                await multiSigWallet.executeTransaction(txIndex4, {"from": accounts[1]});
            }

            await _grantRoleMultisig(
                EMPTY_BYTES,
                accounts[0]
            )

            await vaultService.withdrawExtraSupportedTokens(accounts[0], {"from": accounts[0]});
        })
    })

    describe('Scenario - to pause staking service in case of emergency shutdown, let users to withdraw using emergencyUnlockAndWithdraw and then pause the Vault Contract as well', async() => {
        
        it('Should make lock position staker_4 - here we create snapshot', async() => {
            snapshotToRevertTo = await blockchain.createSnapshot()
            await FTHMToken.approve(stakingService.address, sumToApprove, {from: staker_4})
            const unlockTime =  20 * 24 * 60 * 60
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            let result3 = await stakingService.createLock(sumToDeposit,unlockTime,{from: staker_4, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })

        it('Should make lock position staker_4', async() => {
            const unlockTime =  20 * 24 * 60 * 60
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            let result3 = await stakingService.createLock(sumToDeposit,unlockTime,{from: staker_4, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })

        it('Should make lock position staker_3', async() => {
            const unlockTime =  20 * 24 * 60 * 60
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            let result3 = await stakingService.createLock(sumToDeposit,unlockTime,{from: staker_3, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })

        it('Should make lock position staker_3', async() => {
            const unlockTime =  20 * 24 * 60 * 60
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            let result3 = await stakingService.createLock(sumToDeposit,unlockTime,{from: staker_3, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })

        it('Should make lock position staker_3', async() => {
            const unlockTime =  20 * 24 * 60 * 60
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            let result3 = await stakingService.createLock(sumToDeposit,unlockTime,{from: staker_3, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })

        it('Should make lock position staker_3', async() => {
            const unlockTime =  20 * 24 * 60 * 60
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            let result3 = await stakingService.createLock(sumToDeposit,unlockTime,{from: staker_3, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })

        it('Should make lock position staker_3', async() => {
            const unlockTime =  20 * 24 * 60 * 60
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            let result3 = await stakingService.createLock(sumToDeposit,unlockTime,{from: staker_3, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })


        it("Should pause the staking in case of emergency", async() => {
            const toPauseFlag = 1
            const _pauseContract = async (_contract) => {
                const result = await multiSigWallet.submitTransaction(
                    _contract.address, 
                    EMPTY_BYTES, 
                    _encodeAdminPause(toPauseFlag),
                    0,
                    {"from": accounts[0]}
                );
                const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[0]});
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[1]});
    
                await multiSigWallet.executeTransaction(tx, {"from": accounts[1]});
            }

            await _pauseContract(stakingService)
            
        })
        

        it("Should emergency unlock locked position for staker_3 - emergency unlock will be available for certain time", async() => {
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            await stakingService.emergencyUnlockAndWithdraw({"from": staker_3, gas: 30000000});
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })

        it("Should add support for tokens for new VaultPackageMigrate", async() => {
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            const _addSupportedTokenFromMultiSigTreasury = async (_token) => {
                const result = await multiSigWallet.submitTransaction(
                    vaultMigrateService.address, 
                    EMPTY_BYTES, 
                    _encodeAddSupportedTokenFunction(_token),
                    0,
                    {"from": accounts[0]}
                );
                const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[0]});
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[1]});
    
                await multiSigWallet.executeTransaction(tx, {"from": accounts[1]});
            }
            

            await _addSupportedTokenFromMultiSigTreasury(streamReward1Address)
            await _addSupportedTokenFromMultiSigTreasury(streamReward2Address)
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })

        

        it("Should grant role of rewards operator to new vaultMigrateService", async() => {
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            const roleHash = web3.utils.soliditySha3('REWARDS_OPERATOR_ROLE');
            const _grantRoleMultisig = async (_role, _account) => {
                const result = await multiSigWallet.submitTransaction(
                    vaultMigrateService.address, 
                    EMPTY_BYTES, 
                    _encodeGrantRole(_role, _account),
                    0,
                    {"from": accounts[0]}
                );
                txIndex = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    
                await multiSigWallet.confirmTransaction(txIndex, {"from": accounts[0]});
                await multiSigWallet.confirmTransaction(txIndex, {"from": accounts[1]});
    
                await multiSigWallet.executeTransaction(txIndex, {"from": accounts[1]});
            }

            await _grantRoleMultisig(
                roleHash,
                vaultService.address
            )
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })

        it("Should pause the vault in case of emergency", async() => {
            const toPauseFlag = 1
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            const _pauseContract = async (_contract) => {
                const result = await multiSigWallet.submitTransaction(
                    _contract.address, 
                    EMPTY_BYTES, 
                    _encodeAdminPause(toPauseFlag),
                    0,
                    {"from": accounts[0]}
                );
                const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[0]});
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[1]});
    
                await multiSigWallet.executeTransaction(tx, {"from": accounts[1]});
            }

            await _pauseContract(vaultService)
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })


        it("Should migrate original vault tokens to vaultMigrateService", async() => {
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            const _migrateVaultTokens = async (_contract) => {
                const result = await multiSigWallet.submitTransaction(
                    vaultService.address, 
                    EMPTY_BYTES, 
                    _encodeMigrate(_contract),
                    0,
                    {"from": accounts[0]}
                );
                const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[0]});
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[1]});
    
                await multiSigWallet.executeTransaction(tx, {"from": accounts[1]});
            }
            await _migrateVaultTokens(vaultMigrateService.address)
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })

        it("Should revert emergency unlock as vault does not have enough tokens after migration", async() => {
            let errorMessage = "revert";
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            await shouldRevertAndHaveSubstring(
                stakingService.emergencyUnlockAndWithdraw(
                    {"from": staker_4, gas: 30000000}),
                    errTypes.revert,
                    errorMessage);
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })
    })

    describe('Scenario - when the vault is compromised and we need to pause the vault and update vault to new address', async() => {
        it('Should make lock position staker_4 - here we revert to previous snapshot', async() => {
            await blockchain.revertToSnapshot(snapshotToRevertTo);
            await FTHMToken.approve(stakingService.address, sumToApprove, {from: staker_4})
            const unlockTime =  20 * 24 * 60 * 60
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            let result3 = await stakingService.createLock(sumToDeposit,unlockTime,{from: staker_4, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })

        it('Should make lock position staker_4', async() => {
            const unlockTime =  20 * 24 * 60 * 60
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            let result3 = await stakingService.createLock(sumToDeposit,unlockTime,{from: staker_4, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })

        it('Should make lock position staker_3', async() => {
            const unlockTime =  20 * 24 * 60 * 60
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            let result3 = await stakingService.createLock(sumToDeposit,unlockTime,{from: staker_3, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })

        it("Should pause the vault in case of emergency", async() => {
            const toPauseFlag = 1
            const _pauseContract = async (_contract) => {
                const result = await multiSigWallet.submitTransaction(
                    _contract.address, 
                    EMPTY_BYTES, 
                    _encodeAdminPause(toPauseFlag),
                    0,
                    {"from": accounts[0]}
                );
                const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[0]});
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[1]});
    
                await multiSigWallet.executeTransaction(tx, {"from": accounts[1]});
            }

            await _pauseContract(vaultService)
            
        })

        it("Should revert on creating locks and vault is paused", async() => {
            let errorMessage = "paused contract";
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            const unlockTime =  20 * 24 * 60 * 60
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            await shouldRevert(
                stakingService.createLock(sumToDeposit,unlockTime,{from: staker_3, gas: maxGasForTxn}),
                    errTypes.revert,
                    errorMessage);
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })

        it("Should pause the staking contract to update vault", async() => {
            const toPauseFlag = 1
            const _pauseContract = async (_contract) => {
                const result = await multiSigWallet.submitTransaction(
                    _contract.address, 
                    EMPTY_BYTES, 
                    _encodeAdminPause(toPauseFlag),
                    0,
                    {"from": accounts[0]}
                );
                const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[0]});
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[1]});
    
                await multiSigWallet.executeTransaction(tx, {"from": accounts[1]});
            }

            await _pauseContract(stakingService)
            
        })

        it("Should revert emergency unlock as vault is paused", async() => {
            let errorMessage = "revert";
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            await shouldRevertAndHaveSubstring(
                stakingService.emergencyUnlockAndWithdraw(
                    {"from": staker_4, gas: 30000000}),
                    errTypes.revert,
                    errorMessage);
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })

        
        it("Should add support for tokens for new VaultPackageMigrate", async() => {
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            const _addSupportedTokenFromMultiSigTreasury = async (_token) => {
                const result = await multiSigWallet.submitTransaction(
                    vaultMigrateService.address, 
                    EMPTY_BYTES, 
                    _encodeAddSupportedTokenFunction(_token),
                    0,
                    {"from": accounts[0]}
                );
                const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[0]});
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[1]});
    
                await multiSigWallet.executeTransaction(tx, {"from": accounts[1]});
            }
            

            await _addSupportedTokenFromMultiSigTreasury(streamReward1Address)
            await _addSupportedTokenFromMultiSigTreasury(streamReward2Address)
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })


        it("Should grant role of rewards operator to old vault service for new vault package", async() => {
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            const roleHash = web3.utils.soliditySha3('REWARDS_OPERATOR_ROLE');
            const _grantRoleMultisig = async (_role, _account) => {
                const result = await multiSigWallet.submitTransaction(
                    vaultMigrateService.address, 
                    EMPTY_BYTES, 
                    _encodeGrantRole(_role, _account),
                    0,
                    {"from": accounts[0]}
                );
                txIndex = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    
                await multiSigWallet.confirmTransaction(txIndex, {"from": accounts[0]});
                await multiSigWallet.confirmTransaction(txIndex, {"from": accounts[1]});
    
                await multiSigWallet.executeTransaction(txIndex, {"from": accounts[1]});
            }

            await _grantRoleMultisig(
                roleHash,
                vaultService.address
            )

            await _grantRoleMultisig(
                roleHash,
                stakingService.address
            )
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })


        it("Should migrate original vault tokens to vaultMigrateService", async() => {
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            const _migrateVaultTokens = async (_contract) => {
                const result = await multiSigWallet.submitTransaction(
                    vaultService.address, 
                    EMPTY_BYTES, 
                    _encodeMigrate(_contract),
                    0,
                    {"from": accounts[0]}
                );
                const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[0]});
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[1]});
    
                await multiSigWallet.executeTransaction(tx, {"from": accounts[1]});
            }
            await _migrateVaultTokens(vaultMigrateService.address)
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })

        it("Should update vault", async() => {
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            const _updateVault = async (_contract) => {
                const result = await multiSigWallet.submitTransaction(
                    stakingService.address, 
                    EMPTY_BYTES, 
                    _encodeUpdateVault(_contract),
                    0,
                    {"from": accounts[0]}
                );
                const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[0]});
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[1]});
    
                await multiSigWallet.executeTransaction(tx, {"from": accounts[1]});
            }
            await _updateVault(vaultMigrateService.address)
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })

        it("Should unpause staking and the normal create locking should work", async() => {
            const toUnpauseFlag = 0
            const _unpauseContract = async (_contract) => {
                const result = await multiSigWallet.submitTransaction(
                    _contract.address, 
                    EMPTY_BYTES, 
                    _encodeAdminPause(toUnpauseFlag),
                    0,
                    {"from": accounts[0]}
                );
                const tx = eventsHelper.getIndexedEventArgs(result, SUBMIT_TRANSACTION_EVENT)[0];
    
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[0]});
                await multiSigWallet.confirmTransaction(tx, {"from": accounts[1]});
    
                await multiSigWallet.executeTransaction(tx, {"from": accounts[1]});
            }

            await _unpauseContract(stakingService)
        })

        it('Should make lock position staker_3', async() => {
            const unlockTime =  20 * 24 * 60 * 60
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            let result3 = await stakingService.createLock(sumToDeposit,unlockTime,{from: staker_3, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })
    })

});
   
