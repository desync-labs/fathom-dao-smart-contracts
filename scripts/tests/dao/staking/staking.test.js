const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const BN = web3.utils.BN
const chai = require("chai");
const { expect } = chai.use(require('chai-bn')(BN));
const should = chai.use(require('chai-bn')(BN)).should();

const utils = require('../../helpers/utils');
const eventsHelper = require("../../helpers/eventsHelper");
const blockchain = require("../../helpers/blockchain");




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
    let vMainToken;

    let streamReward1;
    let streamReward2;

    let vMainTokenAddress;
    let FTHMTokenAddress;
    let streamReward1Address;
    let streamReward2Address;

    let maxWeightShares;
    let minWeightShares;
    let maxWeightPenalty;
    let minWeightPenalty;
    let vMainTokenCoefficient;
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
        

        const weightObject =  _createWeightObject(
                              maxWeightShares,
                              minWeightShares,
                              maxWeightPenalty,
                              minWeightPenalty,
                              weightMultiplier)
        //this is used for stream shares calculation.
        vMainTokenCoefficient = 500;
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

        await stakingGetterService.setWeight(
            weightObject,
            {from: SYSTEM_ACC}
        )

        FTHMToken = await artifacts.initializeInterfaceAt("MainToken","MainToken");
        streamReward1 = await artifacts.initializeInterfaceAt("ERC20Rewards1","ERC20Rewards1");
        streamReward2 = await artifacts.initializeInterfaceAt("ERC20Rewards2","ERC20Rewards2");
        
        await streamReward1.transfer(stream_rewarder_1,web3.utils.toWei("10000","ether"),{from: SYSTEM_ACC});
        await streamReward2.transfer(stream_rewarder_2,web3.utils.toWei("10000","ether"),{from: SYSTEM_ACC});
        
        vMainToken = await artifacts.initializeInterfaceAt("VMainToken", "VMainToken");
        
        
        await vMainToken.addToWhitelist(stakingService.address, {from: SYSTEM_ACC})
        
        minter_role = await vMainToken.MINTER_ROLE();
        await vMainToken.grantRole(minter_role, stakingService.address, {from: SYSTEM_ACC});

        vMainTokenAddress = vMainToken.address;
        FTHMTokenAddress = FTHMToken.address;
        streamReward1Address = streamReward1.address;
        streamReward2Address = streamReward2.address;
        
        await FTHMToken.transfer(staker_1,sumToTransfer, {from: SYSTEM_ACC})
        await FTHMToken.transfer(staker_2,sumToTransfer, {from: SYSTEM_ACC})
        await FTHMToken.transfer(staker_3,sumToTransfer, {from: SYSTEM_ACC})
        await FTHMToken.transfer(staker_4,sumToTransfer, {from: SYSTEM_ACC})
        await FTHMToken.transfer(stream_manager, sumForProposer, {from: SYSTEM_ACC})
        
        await vMainToken.approve(stakingService.address,vMainTokensToApprove, {from: SYSTEM_ACC})

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
        await vaultService.addSupportedToken(FTHMTokenAddress)
        await vaultService.addSupportedToken(streamReward1Address)
        await vaultService.addSupportedToken(streamReward2Address)
        
        const admin_role = await vaultService.ADMIN_ROLE();
        await vaultService.grantRole(admin_role, stakingService.address, {from: SYSTEM_ACC});

        await stakingService.initializeStaking(
            vault_test_address,
            FTHMTokenAddress,
            vMainTokenAddress,
            weightObject,
            stream_owner,
            scheduleTimes,
            scheduleRewards,
            2,
            vMainTokenCoefficient,
            lockingVoteWeight,
            maxNumberOfLocks
            //_flags
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
            let lockingPeriod = 24 * 60 * 60;

            const unlockTime = lockingPeriod;
            let result = await stakingService.createLock(sumToDeposit,unlockTime, staker_1,{from: staker_1});
            // Since block time stamp can change after locking, we record the timestamp, 
                // later to be used in the expectedNVFTHM calculation.  
                // This mitigates an error created from the slight change in block time.

            
            const expectedFTHMBalanceStaker1 = _calculateRemainingBalance(sumToDeposit, beforeFTHMBalance.toString())
            const afterFTHMBalance = await FTHMToken.balanceOf(staker_1);
            
            let eventArgs = eventsHelper.getIndexedEventArgs(result, "Staked(address,uint256,uint256,uint256)");
            const expectedLockId = 1
            
            assert.equal(eventArgs[2].toString(),expectedLockId)
            assert.equal(afterFTHMBalance.toString(),expectedFTHMBalanceStaker1.toString())

            const expectedNVFTHM = _calculateNumberOfVFTHM(sumToDeposit, lockingPeriod, lockingVoteWeight)
            expectedTotalAmountOfVFTHM = expectedTotalAmountOfVFTHM.add(expectedNVFTHM)

            const staker1VeTokenBal = (await vMainToken.balanceOf(staker_1)).toString()

            //  Here we check that the correct amount of vote was minted.
            staker1VeTokenBal.should.be.bignumber.equal(expectedNVFTHM)
        });
        
        it("Should create a second lock possition for staker_1, and check that correct number of vote tokens are released", async() => {
            
            await blockchain.increaseTime(20);
            let lockingPeriod = 24 * 60 * 60;
            
            const unlockTime = lockingPeriod;
            let result = await stakingService.createLock(sumToDeposit,unlockTime,staker_1,{from: staker_1, gas:maxGasForTxn});
            
            let eventArgs = eventsHelper.getIndexedEventArgs(result, "Staked(address,uint256,uint256,uint256)");
            const actualNVFTHM = web3.utils.toBN(eventArgs[1]);

            //lockingVoteWeight = 365 * 24 * 60 * 60;
            const expectedNVFTHM = _calculateNumberOfVFTHM(sumToDeposit, lockingPeriod, lockingVoteWeight)
            
            const expectedShares = _calculateNumberOfStreamShares(sumToDeposit, vMainTokenCoefficient, actualNVFTHM, maxWeightShares);
            const actualShares = web3.utils.toBN(eventArgs[0])
            
            actualNVFTHM.should.be.bignumber.equal(expectedNVFTHM)
            actualShares.should.be.bignumber.equal(expectedShares)
            expectedTotalAmountOfVFTHM = expectedTotalAmountOfVFTHM.add(expectedNVFTHM)

        })

        // it("Should update total vote token balance.", async() => {
        //     const totalAmountOfVFTHM = (await stakingService.totalAmountOfveFTHM()).toString();
        //     expectedTotalAmountOfVFTHM.should.be.bignumber.equal(totalAmountOfVFTHM);
        // })

        it("Should have correct total number of staked protocol tokens", async() => {
            //2 deposits:
            const sumToDepositBN = new web3.utils.BN(sumToDeposit);
            const expectedTotalAmountOfStakedFTHM = sumToDepositBN.add(sumToDepositBN);
            let result = await stakingService.totalAmountOfStakedFTHM()
            const totalAmountOfStakedFTHM = result;
            assert.equal(totalAmountOfStakedFTHM.toString(),expectedTotalAmountOfStakedFTHM.toString())
            const totalFTHMShares = await stakingService.totalFTHMShares();
            expect(totalFTHMShares).to.eql(totalAmountOfStakedFTHM)
        })


        it("Setup a lock position for staker_2, staker_3, staker_4", async() => {
            const unlockTime =  500;
            const expectedLockId = 1
            
            const sumToDepositForAll = web3.utils.toWei('0.11', 'ether');

            await FTHMToken.approve(stakingService.address, sumToApprove, {from: staker_2})
            await FTHMToken.approve(stakingService.address, sumToApprove, {from: staker_3})
            await FTHMToken.approve(stakingService.address, sumToApprove, {from: staker_4})
            
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            
            let result1 = await stakingService.createLock(sumToDepositForAll,unlockTime, staker_2,{from: staker_2});
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            let result2 = await stakingService.createLock(sumToDepositForAll,unlockTime, staker_3,{from: staker_3});
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            let result3 = await stakingService.createLock(sumToDepositForAll,unlockTime,staker_4, {from: staker_4});
            await blockchain.mineBlock(await _getTimeStamp() + 20);

            let eventArgs1 = eventsHelper.getIndexedEventArgs(result1, "Staked(address,uint256,uint256,uint256)");
            let eventArgs2 = eventsHelper.getIndexedEventArgs(result2, "Staked(address,uint256,uint256,uint256)");
            let eventArgs3 = eventsHelper.getIndexedEventArgs(result3, "Staked(address,uint256,uint256,uint256)");

            // Check that the lock id is being assigned correctly.  For each staker, their first respective lockId is 1
            assert.equal(eventArgs1[2].toString(),expectedLockId)
            assert.equal(eventArgs2[2].toString(),expectedLockId)
            assert.equal(eventArgs3[2].toString(),expectedLockId)
        })




        it("Should not unlock locked position before the end of the lock possition's lock period - staker_1", async() => {
            
            const errorMessage = "lock not open";

            await shouldRevert(
                stakingService.unlock(1, {from: staker_1}),
                errTypes.revert,  
                errorMessage
            );
            //  staker_1 would have to use the function earlyUnlock() to unlock before the lock period has passed.
        })


        it("Setup a third locked position with a 5 second lock period: LockId = 3 - staker_1", async() => {
            const unlockTime =  5;

            let result = await stakingService.createLock(sumToDeposit,unlockTime,staker_1,{from: staker_1});
            await blockchain.mineBlock(await _getTimeStamp() + 20);
        })
        
        it("Should get correct staked amount from staking getter service", async() => {
            let result = await stakingGetterService.getUserTotalDeposit(staker_1);
            let shouldBeTotal = (new web3.utils.BN(sumToDeposit)).mul(new web3.utils.BN(3));

            assert(result.toString(), shouldBeTotal.toString())
            
        })

        
        
        it("Should completely unlock LockId = 1 - staker_1, replace LockId 1 with LockId 3 in the locks array for staker_1", async() => {
            // The lock array for staker_1 should reduce in length by 1 on the backend.
            const sumToUnstake = web3.utils.toWei('0.01','ether')
            await blockchain.mineBlock(await _getTimeStamp() + 24 * 60 * 60 + 10);
            

            let result = await stakingGetterService.getLockInfo(staker_1,3);
            const amountOfVFTHMLock3 = result.amountOfveFTHM.toString()

            await stakingService.unlock(1, {from : staker_1});
            const errorMessage = "out of index";

            await shouldRevert(
                stakingGetterService.getLockInfo(staker_1,3),
                errTypes.revert,  
                errorMessage
            );

            result = await stakingGetterService.getLockInfo(staker_1,1);
            
            assert(amountOfVFTHMLock3, result.amountOfveFTHM.toString());
            await blockchain.mineBlock(await _getTimeStamp() + 20);
        })

        
        it("Should unlock completely locked positions for user - staker_2", async() => {
            let result = await stakingGetterService.getLockInfo(staker_2,1);
            const beforeVOTEBalance  = (await vMainToken.balanceOf(staker_2)).toString()
            await stakingService.unlock(1, {from: staker_2});
            const afterVOTEBalance  = (await vMainToken.balanceOf(staker_2)).toString()
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



        it("Should unlock completely locked positions for user - staker_4", async() => {
            await stakingService.unlock(1, {from: staker_4});
            const errorMessage = "out of index";

            await shouldRevert(
                stakingGetterService.getLockInfo(staker_4,1),
                errTypes.revert,  
                errorMessage
            );
            

        });

        it("Should unlock completely for locked position 1 - staker_1", async() => {
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            let result = await stakingService.unlock(1, {from : staker_1});
            
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            await stakingService.unlock(1, {from : staker_1});
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            const totalAmountOfStakedFTHM = await stakingService.totalAmountOfStakedFTHM()
            const totalFTHMShares = await stakingService.totalFTHMShares();
            const totalAmountOfStreamShares = await stakingService.totalStreamShares()

            assert.equal(totalAmountOfStakedFTHM.toString(),"0")
            assert.equal(totalFTHMShares.toString(),"0")
            assert.equal(totalAmountOfStreamShares.toString(),"0")
            // console.log("----- After all the locks are completely unlocked ------")
            // console.log("totalAmountOfStakedFTHM: ", totalAmountOfStakedFTHM.toString());
            // console.log("totalFTHMShares: ", totalFTHMShares.toString());
            // console.log("totalAmountOfStreamShares: ", totalAmountOfStreamShares.toString());
        });
    });
    
    describe('Creating Streams and Rewards Calculations', async() => {
        
        it("Should propose a stream", async() => {
            const id = 1;

            const maxRewardProposalAmountForAStream = web3.utils.toWei('1000', 'ether');
            const minRewardProposalAmountForAStream = web3.utils.toWei('200', 'ether');

            
            const startTime = await _getTimeStamp() + 1000;
            const scheduleRewards = [
                web3.utils.toWei('1000', 'ether'),
                web3.utils.toWei('800', 'ether'),
                web3.utils.toWei('600', 'ether'),
                web3.utils.toWei('400', 'ether'),
                web3.utils.toWei('200', 'ether'),
                web3.utils.toWei("0", 'ether')
            ]
            const scheduleTimes = [
                startTime,
                startTime + oneMonth,
                startTime + 2 * oneMonth,
                startTime + 3 * oneMonth,
                startTime + 4 * oneMonth,
                startTime + 5 * oneMonth
            ]

            const result = await stakingService.proposeStream(
                stream_rewarder_1,
                streamReward1Address,
                maxRewardProposalAmountForAStream,
                minRewardProposalAmountForAStream,
                scheduleTimes,
                scheduleRewards,
                10
                ,{from: SYSTEM_ACC}  
            )
            await blockchain.mineBlock(await _getTimeStamp() + 10)
        })

        it("Should Create a Stream", async() => {
            // Once createStream is called, the proposal will become live once start time is reached
            const RewardProposalAmountForAStream = web3.utils.toWei('800', 'ether');
            await streamReward1.approve(stakingService.address, RewardProposalAmountForAStream, {from:stream_rewarder_1})
            await stakingService.createStream(1,RewardProposalAmountForAStream, {from: stream_rewarder_1});
            await blockchain.mineBlock(await _getTimeStamp() + 20);
        })

        it("Should propose a second stream, stream - 2", async() => {

            const maxRewardProposalAmountForAStream = web3.utils.toWei('1000', 'ether');
            const minRewardProposalAmountForAStream = web3.utils.toWei('200', 'ether');

            
            const startTime = await _getTimeStamp() + 1000;
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


        it("Should Create a Stream - 2", async() => {
            const RewardProposalAmountForAStream = web3.utils.toWei('1000', 'ether');
            await streamReward2.approve(stakingService.address, RewardProposalAmountForAStream, {from:stream_rewarder_2})
            await stakingService.createStream(2,RewardProposalAmountForAStream, {from: stream_rewarder_2});
        })

        it('Setup Locks for staker_3 and staker_4 reward tests', async() => {
            const lockingPeriod = 20 * 24 * 60 * 60
            const unlockTime =  lockingPeriod;
            
            await stakingService.createLock(sumToDeposit,unlockTime, staker_3,{from: staker_3,gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            await stakingService.createLock(sumToDeposit,unlockTime, staker_4,{from: staker_4,gas: maxGasForTxn});
            
        });


        it('Should get correct Rewards', async() => {
            await blockchain.increaseTime(20);
            let lockingPeriod = 20 * 24 * 60 * 60
            const unlockTime = lockingPeriod;
            
            let beforeLockTimestamp = await _getTimeStamp();
            await stakingService.createLock(sumToDeposit,unlockTime, staker_2,{from: staker_2,gas: maxGasForTxn});
            const mineToTimestamp = 20 * 24 * 60 * 60
            await blockchain.mineBlock(beforeLockTimestamp + mineToTimestamp);
            
            
            const lockId = 1
            const rewardsPeriod = lockingPeriod
            const rewardsPeriodBN = new web3.utils.toBN(rewardsPeriod)
            const RewardProposalAmountForAStream = web3.utils.toWei('1000', 'ether');
            
            await stakingService.claimRewards(2,lockId,{from:staker_2, gas: maxGasForTxn});
            const lockInfo = await stakingGetterService.getLockInfo(staker_2,1)
            const positionStreamSharesBN = new web3.utils.toBN((await lockInfo.positionStreamShares).toString())
            const rewardsAmountTotal = new web3.utils.toBN(RewardProposalAmountForAStream)
            const oneYearBN = new web3.utils.toBN(oneYear)
            const rewards = rewardsPeriodBN.mul(rewardsAmountTotal).div(oneYearBN)

            totalAmountOfStreamShares = await stakingService.totalStreamShares()
            const totalStreamShares = new web3.utils.toBN(totalAmountOfStreamShares.toString())
            const expectedRewards = rewards.mul(positionStreamSharesBN).div(totalStreamShares).toString()
            console.log("expected Rewards for staker_2: ",_convertToEtherBalance(expectedRewards))

            await blockchain.mineBlock(await _getTimeStamp() + 20);
            const pendingRewards = (await stakingService.getUsersPendingRewards(staker_2,2)).toString()
            console.log("pending rewards for staker_ 2:",_convertToEtherBalance(pendingRewards));

            // Minute changes in blocktimes effect the rewards calculations.  
            //  So in reward tests like this one we just check that the expected value is within an acceptable range of the output.
        })

        it('Claim rewards for stream 2 staker_3,staker_4', async() => {
            //Time stamp increased = 20 * 24 * 60 * 60
            const lockId = 1
            let result1 = await stakingService.claimRewards(2,lockId,{from:staker_3, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            let result2 = await stakingService.claimRewards(2,lockId,{from:staker_4, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 20);

            //console.log("gas for claiming first rewards:",result1.gasUsed.toString())
            //console.log("gas for claiming first rewards:",result2.gasUsed.toString())
            let pendingRewards = (await stakingService.getUsersPendingRewards(staker_3,2)).toString()
            console.log("pending rewards staker_3 - 1st Claim: lockId -1",_convertToEtherBalance(pendingRewards));
            pendingRewards = (await stakingService.getUsersPendingRewards(staker_4,2)).toString()
            console.log("pending rewards staker_4 - 1st Claim: lockId -1",_convertToEtherBalance(pendingRewards));
            //  Rewards balance has been increased, but the rewards still need to be withdrawn
            
            
        })
        
        it('Second claim rewards for stream 2 staker_3, staker_4', async() => {
            const timestamp = await _getTimeStamp();
            const mineToTimestamp = 1 * 24 * 60 * 60
            await blockchain.mineBlock(timestamp + mineToTimestamp);

            const lockId = 1
            await stakingService.claimRewards(2,lockId,{from:staker_3, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 20)
            await stakingService.claimRewards(2,lockId,{from:staker_4, gas: maxGasForTxn});
            let pendingRewards = (await stakingService.getUsersPendingRewards(staker_3,2)).toString()
            console.log("pending rewards staker_3 - 2nd Claim: lockId -1",_convertToEtherBalance(pendingRewards));
            pendingRewards = (await stakingService.getUsersPendingRewards(staker_4,2)).toString()
            console.log("pending rewards staker_4 - 2nd Claim: lockId - 1",_convertToEtherBalance(pendingRewards));
        })
        
        it("Should withdraw stream rewards for all stream 2 stakers", async() => {
            let timestamp = await _getTimeStamp();
            let mineToTimestamp = 15
            await blockchain.mineBlock(timestamp + mineToTimestamp);
            
            await stakingService.withdraw(2, {from: staker_2})
            
            let beforeBalanceStaker2 = await streamReward2.balanceOf(staker_3)
            console.log("balance of stream reward token 2, staker _3, before withdraw: ",_convertToEtherBalance(beforeBalanceStaker2.toString()))
            
            await stakingService.withdraw(2, {from: staker_3})
            let afterBalanceStaker2 = await streamReward2.balanceOf(staker_3)
            console.log("balance of stream reward token 2, staker _3, after withdraw: ",_convertToEtherBalance(afterBalanceStaker2.toString()))
            await stakingService.withdraw(2, {from: staker_4})
            
            assert.equal((await stakingService.getUsersPendingRewards(staker_2,2)).toString(),"0")
            assert.equal((await stakingService.getUsersPendingRewards(staker_3,2)).toString(),"0")
            assert.equal((await stakingService.getUsersPendingRewards(staker_3,2)).toString(),"0")
            await blockchain.mineBlock(await _getTimeStamp() + 20);
        })
     
        
        it('Setup 2nd lock position for stakers 2, 4,', async() => {
           
            const lockingPeriod = 20 * 24 * 60 * 60
            const unlockTime =  lockingPeriod;
            
            let result1 = await stakingService.createLock(sumToDeposit,unlockTime,staker_2, {from: staker_2, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            let result3 = await stakingService.createLock(sumToDeposit,unlockTime, staker_4,{from: staker_4, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 100);

        })

        it('Setup 2nd lock position for stakers 3,', async() => {
            // Seperated because there is a different locking period for staker 3 compared to stakers 2, 4.
           
            const lockingPeriod_staker3 = 12 * 60 * 60
            const unlockTime_staker3 =  lockingPeriod_staker3
            let result2 = await stakingService.createLock(sumToDeposit,unlockTime_staker3,staker_3, {from: staker_3, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })

        it('Claim rewards for stream 2 staker_3,staker_4', async() => {
            let timestamp = await _getTimeStamp();
            let mineToTimestamp = 1* 24 * 60 * 60
            await blockchain.mineBlock(timestamp + mineToTimestamp);
            const lockId = 2    
            const claimableRewards = await stakingService.getStreamClaimableAmountPerLock(2, staker_3, lockId);
            console.log("Claimable rewards: ", _convertToEtherBalance(claimableRewards.toString()))
            
            let result1 = await stakingService.claimRewards(2,lockId,{from:staker_3, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            let result2 = await stakingService.claimRewards(2,lockId,{from:staker_4, gas: maxGasForTxn});
            let pendingRewards = (await stakingService.getUsersPendingRewards(staker_3,2)).toString();
            console.log("pending rewards staker_3 - 1st Claim: lockId -2",_convertToEtherBalance(pendingRewards));
            pendingRewards = (await stakingService.getUsersPendingRewards(staker_4,2)).toString()
            console.log("pending rewards staker_4 - 1st Claim: lockId -2",_convertToEtherBalance(pendingRewards));
            await blockchain.mineBlock(await _getTimeStamp() + 20);
        })

        it('Time passes and the second claim of rewards for stream 2 staker_3,staker_4 is claimed', async() => {
            let timestamp = await _getTimeStamp();
            let mineToTimestamp = 1* 24 * 60 * 60
            await blockchain.mineBlock(timestamp + mineToTimestamp);
            const lockId = 2
            
            let result1 = await stakingService.claimRewards(2,lockId,{from:staker_3, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            let result2 = await stakingService.claimRewards(2,lockId,{from:staker_4, gas: maxGasForTxn});
            let pendingRewards = (await stakingService.getUsersPendingRewards(staker_3,2)).toString();
            console.log("pending rewards staker_3 - 2nd Claim: lockId - 2",_convertToEtherBalance(pendingRewards));
            pendingRewards = (await stakingService.getUsersPendingRewards(staker_4,2)).toString()
            console.log("pending rewards staker_4 - 2nd Claim: lockId - 2",_convertToEtherBalance(pendingRewards));
            await blockchain.mineBlock(await _getTimeStamp() + 20);
        })
        
        it('Setup 3rd and 4th locks for stakers _3', async() => {
            const lockingPeriod = 12 * 60 * 60
            const unlockTime = lockingPeriod;
            let result2 = await stakingService.createLock(sumToDeposit,unlockTime,staker_3, {from: staker_3,gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 20);
            let result3 = await stakingService.createLock(sumToDeposit,unlockTime, staker_3,{from: staker_3, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 20);
        })

        it('Should update rewards when unlocking lock position 3, for staker_3', async() =>{

            // A warning to be included in the front end:
            //  Rewards need to be claimed before a possition is unlocked, so that stakers don't lose reward tokens.
            const streamId = 2
            const lockId = 3
            let timestamp = await _getTimeStamp();
            let mineToTimestamp = 100

            //lockId 3 rewards claimed
            await blockchain.mineBlock(timestamp + mineToTimestamp);
            await stakingService.claimRewards(streamId,lockId,{from:staker_3});
            
            await blockchain.mineBlock(await _getTimeStamp() + mineToTimestamp);
            await stakingService.withdraw(streamId, {from: staker_3})

            //-- main logic --  starts from here:
            timestamp = await _getTimeStamp();
            mineToTimestamp = 1* 24 * 60 * 60
            await blockchain.mineBlock(timestamp + mineToTimestamp);

            //lockId 3 rewards claimed
            await stakingService.claimRewards(streamId,lockId,{from:staker_3});
            let pendingRewards = (await stakingService.getUsersPendingRewards(staker_3,streamId)).toString()
            console.log("pending rewards for lock Id 3 at first claim",_convertToEtherBalance(pendingRewards));

            mineToTimestamp = 100
            await blockchain.mineBlock(await _getTimeStamp() + mineToTimestamp);
            //lockId 3 all rewards for streamId 2 withdrawn
            await stakingService.withdraw(streamId, {from: staker_3})
            await blockchain.mineBlock(await _getTimeStamp() + mineToTimestamp);
            //lockId is unlocked:
            await stakingService.unlock(lockId, {from : staker_3, gas: 600000});
            await blockchain.mineBlock(await _getTimeStamp() + mineToTimestamp);

            //so Now, the previous lockId 4 is lockId 3:
            await stakingService.claimRewards(streamId,lockId,{from:staker_3});
            pendingRewards = (await stakingService.getUsersPendingRewards(staker_3,streamId)).toString()
            console.log("pending rewards for lockId 3 (previously 4) after unlocking:",_convertToEtherBalance(pendingRewards));
            await blockchain.mineBlock(await _getTimeStamp() + mineToTimestamp);

            
        })

        it("Should get all unlocked main token for staker - 3", async() => {
            //  When we unlock, the main token should be sent to stream 0, with users stream id.  
            // Once unlocked, the token is available for withdrawl from stream 0 to staker - 3.
            // streamId 0 is the id for the main protocol token
            const streamId = 0            
            // Here we use getUsersPendingRewards, for stream id 0, to check the balance of main protocol token, since 
            //      the main protocol token is always distributed/released through stream 0.
            const pendingStakedFTHM = await stakingService.getUsersPendingRewards(staker_3, streamId)

            let beforeBalanceOfStaker_3 = await FTHMToken.balanceOf(staker_3);

            await blockchain.mineBlock(15 + await _getTimeStamp())
            await stakingService.withdraw(streamId, {from: staker_3})

            const afterBalanceOfStaker_3 = await FTHMToken.balanceOf(staker_3);
            
            const expectedFTHMBalanceStaker3 =_calculateAfterWithdrawingBalance(pendingStakedFTHM.toString(),beforeBalanceOfStaker_3.toString());
            assert.equal(afterBalanceOfStaker_3.toString(), expectedFTHMBalanceStaker3.toString())
        })

        it("Should apply penalty to early withdrawal - larger penalty for earlier withdrawl", async() => {
            const lockId = 4
            const streamId = 0
            await blockchain.mineBlock(await _getTimeStamp() + 20)
            await stakingService.withdraw(streamId, {from: staker_3})

            pendingStakedFTHM = await stakingService.getUsersPendingRewards(staker_3,streamId)
            console.log("Pending user accounts after withdraw: ",pendingStakedFTHM.toString())

            const lockingPeriod = 365 * 24 * 60 * 60;
            unlockTime =  lockingPeriod;
            await stakingService.createLock(sumToDeposit,unlockTime,staker_3, {from: staker_3,gas: maxGasForTxn});
            await blockchain.mineBlock(60 * 60 + await _getTimeStamp())
            const penalty = await stakingGetterService.getFeesForEarlyUnlock(lockId, staker_3);
            console.log("penalty for staker if he early unlocks now", _convertToEtherBalance(penalty.toString()))
            await stakingService.earlyUnlock(lockId, {from: staker_3})

            pendingStakedFTHM = await stakingService.getUsersPendingRewards(staker_3,streamId)

        })

        
        it("Should unlock all lock positions: ", async() =>{
            
            const lockingPeriod = 370 * 24 * 60 * 60
            await blockchain.mineBlock(lockingPeriod + await _getTimeStamp())
            let result = await stakingService.unstakePartially(1,1,{from: staker_2});
            await blockchain.mineBlock(15 + await _getTimeStamp())
            result = await stakingService.unlock(1, {from: staker_2});
            console.log("unlocking gas used",result.gasUsed.toString())
            await blockchain.mineBlock(15 + await _getTimeStamp())
            
            result = await stakingService.unlock(1, {from: staker_2});
            console.log("unlocking gas used",result.gasUsed.toString())
            await blockchain.mineBlock(15 + await _getTimeStamp())

            
            result = await stakingService.unlock(1, {from : staker_3});
            console.log("unlocking gas used",result.gasUsed.toString())
            await blockchain.mineBlock(15 + await _getTimeStamp())
            
            await stakingService.unlock(1, {from: staker_3});
            console.log("unlocking gas used",result.gasUsed.toString())
            await blockchain.mineBlock(15 + await _getTimeStamp())
            
            await stakingService.unlock(1, {from: staker_3});
            console.log("unlocking gas used",result.gasUsed.toString())
            await blockchain.mineBlock(15 + await _getTimeStamp())
            
            await stakingService.unlock(1, {from: staker_4});
            console.log("unlocking gas used",result.gasUsed.toString())
            await blockchain.mineBlock(15 + await _getTimeStamp())
            
            await stakingService.unlock(1, {from: staker_4});
            console.log("unlocking gas used",result.gasUsed.toString())
            await blockchain.mineBlock(15 + await _getTimeStamp())
            
            const totalAmountOfStakedFTHM = await stakingService.totalAmountOfStakedFTHM()
            const totalFTHMShares = await stakingService.totalFTHMShares();
            const totalAmountOfStreamShares = await stakingService.totalStreamShares()

            // console.log("----- After all the locks are completely unlocked ------")
            // console.log("totalAmountOfStakedFTHM: ", totalAmountOfStakedFTHM.toString());
            // console.log("totalFTHMShares: ", totalFTHMShares.toString());
            // console.log("totalAmountOfStreamShares: ", totalAmountOfStreamShares.toString());

            assert.equal(totalAmountOfStakedFTHM.toString(),"0")
            assert.equal(totalFTHMShares.toString(),"0")
            assert.equal(totalAmountOfStreamShares.toString(),"0")
        })
        // The following tests are just to check individual test cases
        it("Should apply penalty to early withdrawal", async() => {
            const lockId = 1
            const streamId = 0
            await stakingService.withdraw(streamId, {from: staker_3})
            await blockchain.mineBlock(await _getTimeStamp() + 20)
            const lockingPeriod = 60 * 60
            let unlockTime =  lockingPeriod;
            await stakingService.createLock(sumToDeposit,unlockTime,staker_3, {from: staker_3,gas: maxGasForTxn});
            await blockchain.mineBlock(10 + await _getTimeStamp())
            await stakingService.earlyUnlock(lockId, {from: staker_3})

            pendingStakedFTHM = await stakingService.getUsersPendingRewards(staker_3,streamId)
            console.log("Pending user accounts with early withdrawal: ",_convertToEtherBalance(pendingStakedFTHM.toString()))

            const errorMessage = "out of index";

            await shouldRevert(
                stakingGetterService.getLockInfo(staker_3,lockId),
                errTypes.revert,  
                errorMessage
            );

        })

        it('Setup lock position for stakers _4,', async() => {
           
            const lockingPeriod = 20 * 24 * 60 * 60
            const unlockTime =  lockingPeriod;
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            let result3 = await stakingService.createLock(sumToDeposit,unlockTime,staker_4, {from: staker_4, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 100);

        })

        it('Setup lock position for accounts[9] for govn to use', async() => {
            const sumToTransfer = web3.utils.toWei('25000', 'ether');
            await FTHMToken.transfer(accounts[9],sumToTransfer, {from: SYSTEM_ACC})
            const sumToApprove = web3.utils.toWei('20000','ether');

            await FTHMToken.approve(stakingService.address, sumToApprove, {from: accounts[9]})  
            const lockingPeriod = 365 * 24 * 60 * 60
            const unlockTime =  lockingPeriod;

            const sumToDeposit = web3.utils.toWei('20000', 'ether');
            let result1 = await stakingService.createLock(sumToDeposit,unlockTime,accounts[9], {from: accounts[9], gas: maxGasForTxn});
            
            let eventArgs = eventsHelper.getIndexedEventArgs(result1, "Staked(address,uint256,uint256,uint256)");
            const actualNVFTHM = web3.utils.toBN(eventArgs[1])
            console.log("Is 20000 VOTE TOKEN REleased? ", _convertToEtherBalance(actualNVFTHM.toString()))    

        })

        it("Should get correct user total votes from staking getter service", async() => {
            let result = await stakingGetterService.getUserTotalVotes(accounts[9])
            console.log("accounts[9] vote balance from staking getter service", _convertToEtherBalance(result.toString()),"VOTES")
        })

        it('Should withdraw penalty to treasury', async() =>{
            await blockchain.mineBlock(10 + await _getTimeStamp());
            const beforeBalanceOfTreasury = await FTHMToken.balanceOf(treasury);
            let totalPenaltyBalance = await stakingService.totalPenaltyBalance();
            await stakingService.withdrawPenalty(treasury);
            
            const afterBalanceOfTreasury = await FTHMToken.balanceOf(treasury);
            const expectedDifferenceInBalance = _calculateRemainingBalance(beforeBalanceOfTreasury.toString(),afterBalanceOfTreasury.toString())
            expectedDifferenceInBalance.should.be.bignumber.equal(totalPenaltyBalance.toString())
            totalPenaltyBalance = await stakingService.totalPenaltyBalance();
            
            assert(totalPenaltyBalance.toString(),"0")
        })

        it('Paused contract should not make lock position', async() => {
            const toPauseFlag = 1

            await stakingService.adminPause(toPauseFlag, { from: SYSTEM_ACC})
            const lockingPeriod = 20 * 24 * 60 * 60
            const unlockTime =  lockingPeriod;
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            const errorMessage = "paused contract"
            await shouldRevert(
                stakingService.createLock(sumToDeposit,unlockTime, staker_4,{from: staker_4, gas: maxGasForTxn}),
                errTypes.revert,  
                errorMessage
            );
        })

        it('Unpaused contract should  make lock position', async() => {
            const toUnPauseFlag = 0
            await stakingService.adminPause(toUnPauseFlag, { from: SYSTEM_ACC})
            const lockingPeriod = 20 * 24 * 60 * 60
            const unlockTime =  lockingPeriod;
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            let result3 = await stakingService.createLock(sumToDeposit,unlockTime,staker_4, {from: staker_4, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })

        it('Should should  make lock position with 0 lock period', async() => {
            const toUnPauseFlag = 0

            await stakingService.adminPause(toUnPauseFlag, { from: SYSTEM_ACC})
            const unlockTime =  0;
            await blockchain.mineBlock(await _getTimeStamp() + 100);
            let result3 = await stakingService.createLock(sumToDeposit,unlockTime, staker_4,{from: staker_4, gas: maxGasForTxn});
            await blockchain.mineBlock(await _getTimeStamp() + 100);
        })
    })
});
   
