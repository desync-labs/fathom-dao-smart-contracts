const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const BN = web3.utils.BN
const chai = require("chai");
const { expect } = chai.use(require('chai-bn')(BN));
const should = chai.use(require('chai-bn')(BN)).should();

const utils = require('../../helpers/utils');
const eventsHelper = require("../../helpers/eventsHelper");
const blockchain = require("../../helpers/blockchain");

var solc = require('solc')


const maxGasForTxn = 600000
const {
    shouldRevert,
    errTypes
} = require('../../helpers/expectThrow');

const SYSTEM_ACC = accounts[0];
const staker_1 = accounts[1];

const stream_owner = accounts[3];
const staker_2 = accounts[4];
const staker_3 = accounts[5];
const staker_4 = accounts[6];

const stream_manager = accounts[7];
const stream_rewarder_1 = accounts[8];
const stream_rewarder_2 = accounts[9];

let vault_test_address;
const treasury = SYSTEM_ACC;

const _createWeightObject = (
    maxWeightShares,
    minWeightShares,
    maxWeightPenalty,
    minWeightPenalty,
    weightMultiplier) => {
    return {
        maxWeightShares: maxWeightShares,
        minWeightShares: minWeightShares,
        maxWeightPenalty: maxWeightPenalty,
        minWeightPenalty: minWeightPenalty,
        penaltyWeightMultiplier: weightMultiplier
    }
}


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

const _calculateNumberOfStreamShares = (sumToDeposit, veMainTokenCoefficient, nVFTHM, maxWeightShares) => {
    const sumToDepositBN = new web3.utils.BN(sumToDeposit);
    const veMainTokenWeightBN = new web3.utils.BN(veMainTokenCoefficient); 
    const maxWeightBN = new web3.utils.BN(maxWeightShares);
    const oneThousandBN = new web3.utils.BN(1000)
    return (sumToDepositBN.add(veMainTokenWeightBN.mul(nVFTHM).div(oneThousandBN))).mul(maxWeightBN)
}

const _calculateRemainingBalance = (depositAmount, beforeBalance) => {
    const depositAmountBN = new web3.utils.BN(depositAmount);
    const beforeBalanceBN = new web3.utils.BN(beforeBalance)
    return beforeBalanceBN.sub(depositAmountBN)
}

const _calculateAfterWithdrawingBalance = (pendingAmount, beforeBalance) => {
    const pendingAmountBN = new web3.utils.BN(pendingAmount);
    const beforeBalanceBN = new web3.utils.BN(beforeBalance)
    return beforeBalanceBN.add(pendingAmountBN)
}

const _convertToEtherBalance = (balance) => {
    return parseFloat(web3.utils.fromWei(balance,"ether").toString()).toFixed(5)
}
const setTreasuryAddress = async (treasury,stakingService) => {
    const storageSlot = 8;
    await stakingService.adminSstoreAddress(
        storageSlot,
        treasury
        )
}

describe("Staking Test", () => {

    const oneMonth = 30 * 24 * 60 * 60;
    const oneYear = 31556926;
    let stakingService;
    let vaultService;
    let stakingGetterService;
    let FTHMToken;
    let veMainToken;

    let streamReward1;
    let streamReward2;

    let veMainTokenAddress;
    let FTHMTokenAddress;
    let streamReward1Address;
    let streamReward2Address;

    let maxWeightShares;
    let minWeightShares;
    let maxWeightPenalty;
    let minWeightPenalty;
    let veMainTokenCoefficient;
    let lockingVoteWeight;
    let totalAmountOfStakedFTHM;
    let totalAmountOfVFTHM;
    let totalAmountOfStreamShares;
    let maxNumberOfLocks;
    let _flags;
    
    const sumToDeposit = web3.utils.toWei('100', 'ether');
    const sumToTransfer = web3.utils.toWei('2000', 'ether');
    const sumToApprove = web3.utils.toWei('3000','ether');
    const sumForProposer = web3.utils.toWei('3000','ether')
    const veMainTokensToApprove = web3.utils.toWei('500000', 'ether')

    before(async() => {
        await snapshot.revertToSnapshot();
        maxWeightShares = 1024;
        minWeightShares = 256;
        maxWeightPenalty = 3000;
        minWeightPenalty = 100;
        weightMultiplier = 10;
        maxNumberOfLocks = 10;
        _flags = 0;
        

        const weightObject =  _createWeightObject(
                              maxWeightShares,
                              minWeightShares,
                              maxWeightPenalty,
                              minWeightPenalty,
                              weightMultiplier)
        //this is used for stream shares calculation.
        veMainTokenCoefficient = 500;
        //this is used for calculation of release of veFTHM
        lockingVoteWeight = 365 * 24 * 60 * 60;
        
        stakingService = await artifacts.initializeInterfaceAt(
            "StakingPackage",
            "StakingPackage"
        );

        vaultService = await artifacts.initializeInterfaceAt(
            "VaultPackage",
            "VaultPackage"
        );

        stakingGetterService = await artifacts.initializeInterfaceAt(
            "StakingGettersHelper",
            "StakingGettersHelper"
        )

        FTHMToken = await artifacts.initializeInterfaceAt("ERC20MainToken","ERC20MainToken");
        streamReward1 = await artifacts.initializeInterfaceAt("ERC20Rewards1","ERC20Rewards1");
        streamReward2 = await artifacts.initializeInterfaceAt("ERC20Rewards2","ERC20Rewards2");
        
        await streamReward1.transfer(stream_rewarder_1,web3.utils.toWei("10000","ether"),{from: SYSTEM_ACC});
        await streamReward2.transfer(stream_rewarder_2,web3.utils.toWei("10000","ether"),{from: SYSTEM_ACC});
        
        veMainToken = await artifacts.initializeInterfaceAt("VeMainToken", "VeMainToken");
        
        
        await veMainToken.addToWhitelist(stakingService.address, {from: SYSTEM_ACC})
        
        minter_role = await veMainToken.MINTER_ROLE();
        await veMainToken.grantRole(minter_role, stakingService.address, {from: SYSTEM_ACC});

        veMainTokenAddress = veMainToken.address;
        FTHMTokenAddress = FTHMToken.address;
        streamReward1Address = streamReward1.address;
        streamReward2Address = streamReward2.address;
        
        await FTHMToken.transfer(staker_1,sumToTransfer, {from: SYSTEM_ACC})
        await FTHMToken.transfer(staker_2,sumToTransfer, {from: SYSTEM_ACC})
        await FTHMToken.transfer(staker_3,sumToTransfer, {from: SYSTEM_ACC})
        await FTHMToken.transfer(staker_4,sumToTransfer, {from: SYSTEM_ACC})
        await FTHMToken.transfer(stream_manager, sumForProposer, {from: SYSTEM_ACC})
        
        await veMainToken.approve(stakingService.address,veMainTokensToApprove, {from: SYSTEM_ACC})

        const twentyPercentOfFTHMTotalSupply = web3.utils.toWei('200000', 'ether');
            
        
        vault_test_address = vaultService.address;
        await FTHMToken.transfer(vault_test_address, twentyPercentOfFTHMTotalSupply, {from: SYSTEM_ACC})

        const startTime =  await _getTimeStamp() + 3 * 24 * 24 * 60;

        const scheduleRewards = [
            web3.utils.toWei('2000', 'ether'),
            web3.utils.toWei('1000', 'ether'),
            web3.utils.toWei('500', 'ether'),
            web3.utils.toWei('250', 'ether'),
            web3.utils.toWei("0", 'ether')
        ]
        const scheduleTimes = [
            startTime,
            startTime + oneYear,
            startTime + 2 * oneYear,
            startTime + 3 * oneYear,
            startTime + 4 * oneYear,
        ]
        await vaultService.initVault();
        
        const admin_role = await vaultService.ADMIN_ROLE();
        await vaultService.grantRole(admin_role, stakingService.address, {from: SYSTEM_ACC});

        await vaultService.addSupportedToken(FTHMTokenAddress)
        await vaultService.addSupportedToken(streamReward1Address)
        await vaultService.addSupportedToken(streamReward2Address)
        
        await stakingService.initializeStaking(
            vault_test_address,
            FTHMTokenAddress,
            veMainTokenAddress,
            weightObject,
            stream_owner,
            scheduleTimes,
            scheduleRewards,
            2,
            veMainTokenCoefficient,
            lockingVoteWeight,
            maxNumberOfLocks
         )
         
         await setTreasuryAddress(
            treasury,
            stakingService
        )
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

            let result = await stakingService.createLock(sumToDeposit,unlockTime, {from: staker_1});
            // Since block time stamp can change after locking, we record the timestamp, 
                // later to be used in the expectedNVFTHM calculation.  
                // This mitigates an error created from the slight change in block time.
            
            const expectedFTHMBalanceStaker1 = _calculateRemainingBalance(sumToDeposit, beforeFTHMBalance.toString())
            const afterFTHMBalance = await FTHMToken.balanceOf(staker_1);
            
            let eventArgs = eventsHelper.getIndexedEventArgs(result, "Staked(address,uint256,uint256,uint256)");
            const expectedLockId = 1
            console.log(".........Total Staked Protocol Token Amount for Lock Position ", _convertToEtherBalance(sumToDeposit));
            assert.equal(eventArgs[2].toString(),expectedLockId)
            assert.equal(afterFTHMBalance.toString(),expectedFTHMBalanceStaker1.toString())

            const expectedNVFTHM = _calculateNumberOfVFTHM(sumToDeposit, lockingPeriod, lockingVoteWeight)
            expectedTotalAmountOfVFTHM = expectedTotalAmountOfVFTHM.add(expectedNVFTHM)

            const staker1VeTokenBal = (await veMainToken.balanceOf(staker_1)).toString()

            //  Here we check that the correct amount of vote was minted.
            staker1VeTokenBal.should.be.bignumber.equal(expectedNVFTHM)
            console.log(".........Released VOTE tokens to staker 1 based upon locking period (1 year) and locking amount  (100 Protocol Tokens) ",_convertToEtherBalance(staker1VeTokenBal), 'VOTE Tokens')
        });
        
        it("Should create a second lock possition for staker_1, and check that correct number of vote tokens are released", async() => {
            await blockchain.increaseTime(20);
            let lockingPeriod = 365 * 24 * 60 * 60 / 2;
            
            const unlockTime = lockingPeriod;
            console.log(".........Creating a second Lock Position for staker 1.........");
            let result = await stakingService.createLock(sumToDeposit,unlockTime,{from: staker_1, gas:maxGasForTxn});
            
            let eventArgs = eventsHelper.getIndexedEventArgs(result, "Staked(address,uint256,uint256,uint256)");
            const actualNVFTHM = web3.utils.toBN(eventArgs[1]);
            
            //lockingVoteWeight = 365 * 24 * 60 * 60;
            const expectedNVFTHM = _calculateNumberOfVFTHM(sumToDeposit, lockingPeriod, lockingVoteWeight)
            console.log(".........Total Staked Protocol Token Amount for Lock Position ", _convertToEtherBalance(sumToDeposit));
            const expectedShares = _calculateNumberOfStreamShares(sumToDeposit, veMainTokenCoefficient, actualNVFTHM, maxWeightShares);
            const actualShares = web3.utils.toBN(eventArgs[0])
            
            actualNVFTHM.should.be.bignumber.equal(expectedNVFTHM)
            actualShares.should.be.bignumber.equal(expectedShares)
            expectedTotalAmountOfVFTHM = expectedTotalAmountOfVFTHM.add(expectedNVFTHM)
            console.log(".........Released VOTE tokens to staker 1 based upon locking period ( 1/2 year )and locking amount (100 Protocol Tokens) ",_convertToEtherBalance(expectedNVFTHM), 'VOTE Tokens')
        })

        it("Should update total vote token balance.", async() => {
            const totalAmountOfVFTHM = (await stakingService.totalAmountOfveFTHM()).toString();
            expectedTotalAmountOfVFTHM.should.be.bignumber.equal(totalAmountOfVFTHM);
            console.log(".........Expected total amount of VOTE Tokens to be Released calculated in Test Script: ", _convertToEtherBalance(expectedTotalAmountOfVFTHM))
            console.log(".........Actual total amount of VOTE Tokens Released: ", _convertToEtherBalance(totalAmountOfVFTHM))
        })

        it("Should have correct total number of staked protocol tokens", async() => {
            //2 deposits:
            const sumToDepositBN = new web3.utils.BN(sumToDeposit);
            const expectedTotalAmountOfStakedFTHM = sumToDepositBN.add(sumToDepositBN);
            let result = await stakingService.totalAmountOfStakedFTHM()
            const totalAmountOfStakedFTHM = result;
            assert.equal(totalAmountOfStakedFTHM.toString(),expectedTotalAmountOfStakedFTHM.toString())
            const totalFTHMShares = await stakingService.totalFTHMShares();
            expect(totalFTHMShares).to.eql(totalAmountOfStakedFTHM)
            console.log(".........Total Amount Of Staked Protocol Token ", _convertToEtherBalance(totalAmountOfStakedFTHM.toString()))
        })


        it("Setup a lock position for Staker 2  and Staker 3", async() => {
            const unlockTime =  500;
            const expectedLockId = 1
            
            const sumToDepositForAll = web3.utils.toWei('0.11', 'ether');

            await FTHMToken.approve(stakingService.address, sumToApprove, {from: staker_2})
            await FTHMToken.approve(stakingService.address, sumToApprove, {from: staker_3})
            
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            console.log(".........Creating a Lock Position for staker 2 and Staker 3.......");
            let result1 = await stakingService.createLock(sumToDepositForAll,unlockTime, {from: staker_2});
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            let result2 = await stakingService.createLock(sumToDepositForAll,unlockTime, {from: staker_3});
            await blockchain.mineBlock(await _getTimeStamp() + 20);

            let eventArgs1 = eventsHelper.getIndexedEventArgs(result1, "Staked(address,uint256,uint256,uint256)");
            let eventArgs2 = eventsHelper.getIndexedEventArgs(result2, "Staked(address,uint256,uint256,uint256)");
            
            // Check that the lock id is being assigned correctly.  For each staker, their first respective lockId is 1
            assert.equal(eventArgs1[2].toString(),expectedLockId)
            assert.equal(eventArgs2[2].toString(),expectedLockId)
        })




        it("Should not unlock locked position before the end of the lock position's lock period - staker_1", async() => {
            
            const errorMessage = "lock not open";

            await shouldRevert(
                stakingService.unlock(1, {from: staker_1}),
                errTypes.revert,  
                errorMessage
            );
            //  staker_1 would have to use the function earlyUnlock() to unlock before the lock period has passed.
        })


        
        // it("Should completely unlock LockId = 1 - staker_1, and swap with last lock position _3", async() => {
        it("Should completely unlock LockId = 1 - staker_1, replace LockId 1 with LockId 2 in the locks array for staker_1", async() => {
            // The lock array for staker_1 should reduce in length by 1 on the backend.
            const sumToUnstake = web3.utils.toWei('0.01','ether')
            const mineTimestamp = 365 * 24 * 60 * 60;
            await blockchain.mineBlock(await _getTimeStamp() + mineTimestamp);
            
            
            let result = await stakingGetterService.getLockInfo(staker_1,2);
            const amountOfVFTHMLock2 = result.amountOfveFTHM.toString()
            
            console.log(".........Unlocking lock position - 1 of Staker_1.......")
            await stakingService.unlock(1, {from : staker_1});
            const errorMessage = "out of index";

            await shouldRevert(
                stakingGetterService.getLockInfo(staker_1,2),
                errTypes.revert,  
                errorMessage
            );

            result = await stakingGetterService.getLockInfo(staker_1,1);
            assert(amountOfVFTHMLock2, result.amountOfveFTHM.toString());

            await blockchain.mineBlock(await _getTimeStamp() + 20);
            console.log(".........Unlocking All The Lock Positions created till Now..........")
        })

        
        it("Should unlock completely locked positions for user - staker_2", async() => {
            let result = await stakingGetterService.getLockInfo(staker_2,1);
            const beforeVOTEBalance  = (await veMainToken.balanceOf(staker_2)).toString()
            await stakingService.unlock(1, {from: staker_2});
            const afterVOTEBalance  = (await veMainToken.balanceOf(staker_2)).toString()
            const amountOfVFTHMLock3 = result.amountOfveFTHM.toString()
            
            const differenceInBalance = _calculateRemainingBalance(afterVOTEBalance,beforeVOTEBalance)
            amountOfVFTHMLock3.should.be.bignumber.equal(differenceInBalance.toString())
            const errorMessage = "out of index";
            // The last lock possition should no longer be accesible
            await shouldRevert(
                stakingGetterService.getLockInfo(staker_2,1),
                errTypes.revert,  
                errorMessage
            );
            await blockchain.mineBlock(await _getTimeStamp() + 20);
        }) 
        
        it("Should unlock completely locked positions for user - staker_3", async() => {
            await stakingService.unlock(1, {from: staker_3});
            const errorMessage = "out of index";

            await shouldRevert(
                stakingGetterService.getLockInfo(staker_3,1),
                errTypes.revert,  
                errorMessage
            );
            
            await blockchain.mineBlock(await _getTimeStamp() + 20);
        });


        it("Should unlock completely for locked position 1 - staker_1", async() => {
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            await stakingService.unlock(1, {from: staker_1});
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            const totalAmountOfStakedFTHM = await stakingService.totalAmountOfStakedFTHM()
            const totalAmountOfStreamShares = await stakingService.totalStreamShares()

            assert.equal(totalAmountOfStakedFTHM.toString(),"0")
            assert.equal(totalAmountOfStreamShares.toString(),"0")
            console.log(".........After all the locks are completely unlocked.........")
            console.log(".........total amount of Staked Protocol Tokens Amount: ", totalAmountOfStakedFTHM.toString());
            console.log(".........total Amount Of Stream Shares: ", totalAmountOfStreamShares.toString());
        });
    });
    
    describe('Creating Streams and Rewards Calculations', async() => {
        
        // it("Should propose a stream", async() => {
        //     const id = 1;
        //     console.log("A protocol wanting to collaborate with us, proposes a stream")
        //     console.log("They provide us their native tokens that they want to distribute to the community")
        //     console.log(".....Creating a Proposal for a stream......")
            
        //     const maxRewardProposalAmountForAStream = web3.utils.toWei('1000', 'ether');
        //     const minRewardProposalAmountForAStream = web3.utils.toWei('200', 'ether');

        //     const startTime = await _getTimeStamp() + 1000
        //     const scheduleRewards = [
        //         web3.utils.toWei('1000', 'ether'),
        //         web3.utils.toWei('800', 'ether'),
        //         web3.utils.toWei('600', 'ether'),
        //         web3.utils.toWei('400', 'ether'),
        //         web3.utils.toWei('200', 'ether'),
        //         web3.utils.toWei("0", 'ether')
        //     ]
        //     const scheduleTimes = [
        //         startTime,
        //         startTime + oneMonth,
        //         startTime + 2 * oneMonth,
        //         startTime + 3 * oneMonth,
        //         startTime + 4 * oneMonth,
        //         startTime + 5 * oneMonth
        //     ]

        //     const result = await stakingService.proposeStream(
        //         stream_rewarder_1,
        //         streamReward1Address,
        //         maxRewardProposalAmountForAStream,
        //         minRewardProposalAmountForAStream,
        //         scheduleTimes,
        //         scheduleRewards,
        //         10
        //         ,{from: stream_manager}  
        //     )
        //     await blockchain.mineBlock(await _getTimeStamp() + 10)
        // })

        // it("Should Create a Stream", async() => {
        //     // Once createStream is called, the proposal will become live once start time is reached
        //     console.log(".....Creating the stream proposed......")
        //     console.log("Once create stream is called, the proposal will become live once start time is reached")
        //     const RewardProposalAmountForAStream = web3.utils.toWei('800', 'ether');
        //     await streamReward1.approve(stakingService.address, RewardProposalAmountForAStream, {from:stream_rewarder_1})
        //     await stakingService.createStream(1,RewardProposalAmountForAStream, {from: stream_rewarder_1});
        //     await blockchain.mineBlock(await _getTimeStamp() + 20);
        // })

        it("Should propose a second stream, stream - 1", async() => {
            console.log("A protocol wanting to collaborate with us, proposes a stream")
            console.log("They provide us their native tokens that they want to distribute to the community")
            console.log(".........Creating a Proposal for a stream..........")
            const maxRewardProposalAmountForAStream = web3.utils.toWei('1000', 'ether');
            const minRewardProposalAmountForAStream = web3.utils.toWei('200', 'ether');

            
            const startTime = await _getTimeStamp() + 20;
            const scheduleRewards = [
                web3.utils.toWei('1000', 'ether'),
                web3.utils.toWei("0", 'ether')
            ]
            
            const scheduleTimes = [
                startTime,
                startTime + oneYear
            ]

            const result = await stakingService.proposeStream(
                stream_rewarder_2,
                streamReward2Address,
                maxRewardProposalAmountForAStream,
                minRewardProposalAmountForAStream,
                scheduleTimes,
                scheduleRewards,
                10
                ,{from: SYSTEM_ACC}
            )

            await blockchain.mineBlock(await _getTimeStamp() + 10)
        })


        it("Should Create a Stream - 1", async() => {
            const streamId = 1
            console.log(".........Creating the stream proposed.........")
            console.log("Once create stream is called, the proposal will become live once start time is reached")
            const RewardProposalAmountForAStream = web3.utils.toWei('1000', 'ether');
            await streamReward2.approve(stakingService.address, RewardProposalAmountForAStream, {from:stream_rewarder_2})
            await stakingService.createStream(streamId,RewardProposalAmountForAStream, {from: stream_rewarder_2});
        })

    

        // it('Setup Locks for staker 3 and staker 4', async() => {
        //     const lockingPeriod = 20 * 24 * 60 * 60
        //     const unlockTime = await _getTimeStamp() + lockingPeriod;
        //     await FTHMToken.approve(stakingService.address, sumToApprove, {from: staker_4})
        //     await stakingService.createLock(sumToDeposit,unlockTime, {from: staker_3,gas: maxGasForTxn});
        //     await blockchain.mineBlock(await _getTimeStamp() + 20);
        //     await stakingService.createLock(sumToDeposit,unlockTime, {from: staker_4,gas: maxGasForTxn});
            
        // });


        // it('Should get correct Rewards', async() => {
        //     const streamId = 1
        //     await blockchain.increaseTime(20);
        //     let lockingPeriod = 20 * 24 * 60 * 60
        //     const unlockTime = await _getTimeStamp() + lockingPeriod;
            
        //     let beforeLockTimestamp = await _getTimeStamp();
        //     await stakingService.createLock(sumToDeposit,unlockTime, {from: staker_2,gas: maxGasForTxn});

        //     lockingPeriod = lockingPeriod - (await _getTimeStamp() - beforeLockTimestamp)
        //     const mineToTimestamp = 20 * 24 * 60 * 60
        //     await blockchain.mineBlock(beforeLockTimestamp + mineToTimestamp);
            
            
        //     const lockId = 1
        //     const rewardsPeriod = lockingPeriod
        //     const rewardsPeriodBN = new web3.utils.toBN(rewardsPeriod)
        //     const RewardProposalAmountForAStream = web3.utils.toWei('1000', 'ether');
            
        //     await stakingService.claimRewards(streamId,lockId,{from:staker_2, gas: maxGasForTxn});
            
        //     //Getting params from contracts to calculate the expected rewards:
        //     const lockInfo = await stakingGetterService.getLockInfo(staker_2,1)
        //     const positionStreamSharesBN = new web3.utils.toBN((await lockInfo.positionStreamShares).toString())
        //     const rewardsAmountTotal = new web3.utils.toBN(RewardProposalAmountForAStream)
        //     const oneYearBN = new web3.utils.toBN(oneYear)
        //     const rewards = rewardsPeriodBN.mul(rewardsAmountTotal).div(oneYearBN)
        //     totalAmountOfStreamShares = await stakingService.totalStreamShares()
        //     const totalStreamShares = new web3.utils.toBN(totalAmountOfStreamShares.toString())
        //     const expectedRewards = rewards.mul(positionStreamSharesBN).div(totalStreamShares).toString()
            
            
        //     console.log("expected Rewards the staker should get based upon stream schedules. (Calculation from Script): ",_convertToEtherBalance(expectedRewards))

        //     await blockchain.mineBlock(await _getTimeStamp() + 20);
        //     const pendingRewards = (await stakingService.getUsersPendingRewards(staker_2,streamId)).toString()
        //     console.log("actual Rewards the staker should get based upon stream schedules. (From The Smart Contract):",_convertToEtherBalance(pendingRewards));
        //     console.log("rewards are based upon how much shares you have on total pool and the actual rewards schedule of the stream");
        //     console.log("Here, rewards = (amount of time passed since stream started) / (total time of stream) * (stream shares of the staker)");

        //     // Minute changes in blocktimes effect the rewards calculations.  
        //     //  So in reward tests like this one we just check that the expected value is within an acceptable range of the output.
        // })

        // it('Claim rewards for stream 2 staker 3,staker 4', async() => {
        //     const streamId = 1
        //     //Time stamp increased = 20 * 24 * 60 * 60
        //     const lockId = 1
        //     let result1 = await stakingService.claimRewards(streamId,lockId,{from:staker_3, gas: maxGasForTxn});
        //     await blockchain.mineBlock(await _getTimeStamp() + 20);
        //     let result2 = await stakingService.claimRewards(streamId,lockId,{from:staker_4, gas: maxGasForTxn});
        //     await blockchain.mineBlock(await _getTimeStamp() + 20);

        //     //console.log("gas for claiming first rewards:",result1.gasUsed.toString())
        //     //console.log("gas for claiming first rewards:",result2.gasUsed.toString())
        //     let pendingRewards = (await stakingService.getUsersPendingRewards(staker_3,streamId)).toString()
        //     console.log("pending rewards staker_3 - 1st Claim: lockId -1",_convertToEtherBalance(pendingRewards));
        //     pendingRewards = (await stakingService.getUsersPendingRewards(staker_4,streamId)).toString()
        //     console.log("pending rewards staker_4 - 1st Claim: lockId -1",_convertToEtherBalance(pendingRewards));
        //     //  Rewards balance has been increased, but the rewards still need to be withdrawn
            
            
        // })
        
        // it('Second claim rewards for stream 2 staker_3, staker_4', async() => {
        //     const streamId = 1
        //     const timestamp = await _getTimeStamp();
        //     const mineToTimestamp = 20 * 24 * 60 * 60
        //     await blockchain.mineBlock(timestamp + mineToTimestamp);

        //     const lockId = 1
        //     await stakingService.claimRewards(streamId,lockId,{from:staker_3, gas: maxGasForTxn});
        //     await blockchain.mineBlock(await _getTimeStamp() + 20)
        //     await stakingService.claimRewards(streamId,lockId,{from:staker_4, gas: maxGasForTxn});
        //     let pendingRewards = (await stakingService.getUsersPendingRewards(staker_3,streamId)).toString()
        //     console.log("pending rewards staker_3 - 2nd Claim: lockId -1",_convertToEtherBalance(pendingRewards));
        //     pendingRewards = (await stakingService.getUsersPendingRewards(staker_4,streamId)).toString()
        //     console.log("pending rewards staker_4 - 2nd Claim: lockId - 1",_convertToEtherBalance(pendingRewards));
        // })
        
        // it("Should withdraw stream rewards for all stream 1 staker 3", async() => {
        //     const streamId = 1
        //     let timestamp = await _getTimeStamp();
        //     let mineToTimestamp = 15
        //     await blockchain.mineBlock(timestamp + mineToTimestamp);
            
        //     await stakingService.withdraw(streamId, {from: staker_2})
            
        //     let beforeBalanceStaker2 = await streamReward2.balanceOf(staker_3)
        //     console.log("balance of stream reward token 2, staker _3, before withdraw: ",_convertToEtherBalance(beforeBalanceStaker2.toString()))
            
        //     await stakingService.withdraw(streamId, {from: staker_3})
        //     let afterBalanceStaker2 = await streamReward2.balanceOf(staker_3)
        //     console.log("balance of stream reward token 2, staker _3, after withdraw: ",_convertToEtherBalance(afterBalanceStaker2.toString()))
        //     await stakingService.withdraw(streamId, {from: staker_4})
            
        //     assert.equal((await stakingService.getUsersPendingRewards(staker_2,streamId)).toString(),"0")
        //     assert.equal((await stakingService.getUsersPendingRewards(staker_3,streamId)).toString(),"0")
        //     assert.equal((await stakingService.getUsersPendingRewards(staker_3,streamId)).toString(),"0")
        //     await blockchain.mineBlock(await _getTimeStamp() + 20);
        // })
     

        
        // it('Setup 2nd and 3rd locks for stakers _3', async() => {
        //     const lockingPeriod = 12 * 60 * 60
        //     const unlockTime = await _getTimeStamp() + lockingPeriod;
        //     let result2 = await stakingService.createLock(sumToDeposit,unlockTime, {from: staker_3,gas: maxGasForTxn});
        //     await blockchain.mineBlock(await _getTimeStamp() + 20);
        //     let result3 = await stakingService.createLock(sumToDeposit,unlockTime, {from: staker_3, gas: maxGasForTxn});
        //     await blockchain.mineBlock(await _getTimeStamp() + 20);
        // })

      

        // it("Should get all unlocked main token for staker - 3", async() => {
        //     //  When we unlock, the main token should be sent to stream 0, with users stream id.  
        //     // Once unlocked, the token is available for withdrawl from stream 0 to staker - 3.
        //     // streamId 0 is the id for the main protocol token
        //     const streamId = 0            
        //     // Here we use getUsersPendingRewards, for stream id 0, to check the balance of main protocol token, since 
        //     //      the main protocol token is always distributed/released through stream 0.
        //     const pendingStakedFTHM = await stakingService.getUsersPendingRewards(staker_3, streamId)
        //     let beforeBalanceOfStaker_3 = await FTHMToken.balanceOf(staker_3);
        //     await blockchain.mineBlock(15 + await _getTimeStamp())
        //     await stakingService.withdraw(streamId, {from: staker_3})

        //     const afterBalanceOfStaker_3 = await FTHMToken.balanceOf(staker_3);
        //     const expectedFTHMBalanceStaker3 =_calculateAfterWithdrawingBalance(pendingStakedFTHM.toString(),beforeBalanceOfStaker_3.toString());
        //     assert.equal(afterBalanceOfStaker_3.toString(), expectedFTHMBalanceStaker3.toString())
        // })

        // it("Should apply penalty to early withdrawal - larger penalty for earlier withdrawl", async() => {
        //     const lockId = 4
        //     const streamId = 0
        //     await blockchain.mineBlock(await _getTimeStamp() + 20)
        //     await stakingService.withdraw(streamId, {from: staker_3})

        //     pendingStakedFTHM = await stakingService.getUsersPendingRewards(staker_3,streamId)
        //     console.log("Pending user accounts after withdraw: ",pendingStakedFTHM.toString())

        //     const lockingPeriod = 365 * 24 * 60 * 60;
        //     unlockTime = await _getTimeStamp() + lockingPeriod;
        //     await stakingService.createLock(sumToDeposit,unlockTime, {from: staker_3,gas: maxGasForTxn});
        //     await blockchain.mineBlock(60 * 60 + await _getTimeStamp())

        //     await stakingService.earlyUnlock(lockId, {from: staker_3})

        //     pendingStakedFTHM = await stakingService.getUsersPendingRewards(staker_3,streamId)
        //     console.log("Pending user accounts with early withdrawal: (approx. 70% of 100 FTHM, due to punishment)",_convertToEtherBalance(pendingStakedFTHM.toString()))
        // })

        
        // it("Should unlock all lock positions: ", async() =>{

        //     const lockingPeriod = 370 * 24 * 60 * 60
        //     await blockchain.mineBlock(lockingPeriod + await _getTimeStamp())
            
        //     let result = await stakingService.unlock(1, {from: staker_2});
        //     console.log("unlocking gas used",result.gasUsed.toString())
        //     await blockchain.mineBlock(15 + await _getTimeStamp())
            
            
            
        //     result = await stakingService.unlock(1, {from : staker_3});
        //     console.log("unlocking gas used",result.gasUsed.toString())
        //     await blockchain.mineBlock(15 + await _getTimeStamp())
            
            
            
        //     await stakingService.unlock(1, {from: staker_3});
        //     console.log("unlocking gas used",result.gasUsed.toString())
        //     await blockchain.mineBlock(15 + await _getTimeStamp())

        //     await stakingService.unlock(1, {from: staker_3});
        //     console.log("unlocking gas used",result.gasUsed.toString())
        //     await blockchain.mineBlock(15 + await _getTimeStamp())
            
        //     await stakingService.unlock(1, {from: staker_4});
        //     console.log("unlocking gas used",result.gasUsed.toString())
        //     await blockchain.mineBlock(15 + await _getTimeStamp())
            
        //     const totalAmountOfStakedFTHM = await stakingService.totalAmountOfStakedFTHM()
        //     const totalFTHMShares = await stakingService.totalFTHMShares();
        //     const totalAmountOfStreamShares = await stakingService.totalStreamShares()

         

        //     assert.equal(totalAmountOfStakedFTHM.toString(),"0")
        //     assert.equal(totalFTHMShares.toString(),"0")
        //     assert.equal(totalAmountOfStreamShares.toString(),"0")
        // })
        // it("Should apply penalty to early withdrawal", async() => {
        //     const lockId = 1
        //     const streamId = 0
        //     await stakingService.withdraw(streamId, {from: staker_3})
        //     await blockchain.mineBlock(await _getTimeStamp() + 20)
        //     const lockingPeriod = 60 * 60
        //     let unlockTime = await _getTimeStamp() + lockingPeriod;
        //     await stakingService.createLock(sumToDeposit,unlockTime, {from: staker_3,gas: maxGasForTxn});
        //     await blockchain.mineBlock(10 + await _getTimeStamp())
        //     await stakingService.earlyUnlock(lockId, {from: staker_3})

        //     pendingStakedFTHM = await stakingService.getUsersPendingRewards(staker_3,streamId)
        //     console.log("Pending user accounts with early withdrawal: ",_convertToEtherBalance(pendingStakedFTHM.toString()))

        //     const errorMessage = "out of index";

        //     await shouldRevert(
        //         stakingGetterService.getLockInfo(staker_3,lockId),
        //         errTypes.revert,  
        //         errorMessage
        //     );

        // })

        // it('Setup lock position for stakers _4,', async() => {
           
        //     const lockingPeriod = 20 * 24 * 60 * 60
        //     const unlockTime = await _getTimeStamp() + lockingPeriod;
        //     await blockchain.mineBlock(await _getTimeStamp() + 100);
        //     let result3 = await stakingService.createLock(sumToDeposit,unlockTime, {from: staker_4, gas: maxGasForTxn});
        //     await blockchain.mineBlock(await _getTimeStamp() + 100);

        // })

        // it('Setup lock position for accounts[9] for govn to use', async() => {
        //     const sumToTransfer = web3.utils.toWei('25000', 'ether');
        //     await FTHMToken.transfer(accounts[9],sumToTransfer, {from: SYSTEM_ACC})
        //     const sumToApprove = web3.utils.toWei('20000','ether');

        //     await FTHMToken.approve(stakingService.address, sumToApprove, {from: SYSTEM_ACC})
        //     await FTHMToken.approve(stakingService.address, sumToApprove, {from: accounts[9]})  
        //     const lockingPeriod = 365 * 24 * 60 * 60
        //     const unlockTime = await _getTimeStamp() + lockingPeriod;

        //     const sumToDeposit = web3.utils.toWei('20000', 'ether');
        //     let result1 = await stakingService.createLock(sumToDeposit,unlockTime, {from: accounts[9], gas: maxGasForTxn});
            
        //     let eventArgs = eventsHelper.getIndexedEventArgs(result1, "Staked(address,uint256,uint256,uint256)");
        //     const actualNVFTHM = web3.utils.toBN(eventArgs[1])
        //     console.log("Is 20000 VOTE TOKEN REleased? ", _convertToEtherBalance(actualNVFTHM.toString()))    

        // })

        // it('Should withdraw penalty to treasury', async() =>{
        //     await blockchain.mineBlock(10 + await _getTimeStamp());
        //     const beforeBalanceOfTreasury = await FTHMToken.balanceOf(treasury);
        //     let totalPenaltyBalance = await stakingService.totalPenaltyBalance();
        //     await stakingService.withdrawPenalty(treasury);
            
        //     const afterBalanceOfTreasury = await FTHMToken.balanceOf(treasury);
        //     const expectedDifferenceInBalance = _calculateRemainingBalance(beforeBalanceOfTreasury.toString(),afterBalanceOfTreasury.toString())
        //     expectedDifferenceInBalance.should.be.bignumber.equal(totalPenaltyBalance.toString())
        //     totalPenaltyBalance = await stakingService.totalPenaltyBalance();
            
        //     assert(totalPenaltyBalance.toString(),"0")
        // })

        it('display all addresses', async() => {
            console.log("Staking Contract Address: ", stakingService.address)
            console.log("Main Token Address: ", FTHMToken.address)
            console.log("VE MAIN Token Address: ", veMainToken.address)
            console.log("Stakin Getters Address: ", stakingGetterService.address)
            console.log("Stream Reward Token Address: ", streamReward1Address)
        })

       

        
    })
});
   