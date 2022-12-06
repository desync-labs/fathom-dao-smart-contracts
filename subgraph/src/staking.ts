import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Staked, Unstaked, StakingPackage, Pending, StreamCreated } from "../generated/StakingPackage/StakingPackage"
import { StakedEvent, UnstakedEvent, Staker, ProtocolStat, LockPosition, Stream} from "../generated/schema";
import { StakingGetter } from "../generated/StakingPackage/StakingGetter"
import { ERC20 } from "../generated/StakingPackage/ERC20"
import { Constants } from "./Utils/Constants"
//TODO Still:
//APR -Subik -Easy
//Daily Rewards - Subik - Easy
//Get Fees - Subik // Can we call? - Tricky. Ask Zach
//Get Lock Period - Subik// Need to add to event lock period -> Easy -> Add event
//Use new contracts so that events can be handled in a way that aggregates the values
export function stakeHandler(event: Staked): void {
    // load ProtocolStat (create if first stake event)
    let protocolStats = ProtocolStat.load(Constants.STAKING_CONTRACT)
    if (protocolStats == null) {
        protocolStats = new ProtocolStat(Constants.STAKING_CONTRACT)
        protocolStats.totalStakeFTHM = BigInt.fromString('0')  
        protocolStats.totalVotes = BigInt.fromString('0') 
        protocolStats.totalUnstakeEvents = BigInt.fromString('0')
        protocolStats.totalStakeEvents = BigInt.fromString('0')
    }
    // increment Total Stake Event count
    protocolStats.totalStakeEvents = protocolStats.totalStakeEvents.plus(BigInt.fromString('1'))

    // Create stake event
    let stakedEvent = new StakedEvent(protocolStats.totalStakeEvents.toString())
    stakedEvent.account = event.params.account
    stakedEvent.streamShares = event.params.streamShares
    stakedEvent.nVoteToken = event.params.nVoteToken
    stakedEvent.lockId = event.params.lockId
    stakedEvent.blockNumber = event.block.number
    stakedEvent.blockTimestamp = event.block.timestamp
    stakedEvent.transaction = event.transaction.hash

    let lockPosition = new LockPosition(event.params.account)
    lockPosition.account = event.params.account
    lockPosition.streamShares = event.params.streamShares
    lockPosition.nVoteToken = event.params.nVoteToken
    lockPosition.amount = event.params.amount
    lockPosition.lockId = event.params.lockId
    lockPosition.end = event.params.end
    lockPosition.blockNumber = event.block.number
    lockPosition.blockTimestamp = event.block.timestamp
    lockPosition.transaction = event.transaction.hash
   
    // Update staker (create staker if first stake for account)
    let staker = Staker.load(event.params.account.toHexString())
    if (staker == null) {
        staker = new Staker(event.params.account.toHexString())
        staker.address = event.params.account
        staker.totalStaked = BigInt.fromString('0')
        staker.accruedRewards = BigInt.fromString('0')
        staker.accruedVotes = BigInt.fromString('0')
    }

    // define contracts
    let stakingPackage = StakingPackage.bind(Address.fromString(Constants.STAKING_CONTRACT))
    let stakingGetter = StakingGetter.bind(Address.fromString(Constants.STAKING_GETTER))
    let vfthmToken = ERC20.bind(Address.fromString(Constants.VFTHM))

    // call contract to set Total Staked for user
    staker.totalStaked = stakingGetter.getUserTotalDeposit(Address.fromBytes(staker.address))

    // call VFTHM contract to get balance for user
    staker.accruedVotes = vfthmToken.balanceOf(Address.fromBytes(staker.address))

    // call contract to set Total Staked and Total Votes for protocol
    protocolStats.totalStakeFTHM = stakingPackage.totalAmountOfStakedToken();
    protocolStats.totalVotes = stakingPackage.totalAmountOfVoteToken();
    protocolStats.save()

    // set staker
    stakedEvent.staker = event.params.account.toHexString()
    stakedEvent.save()

    staker.save()
}

export function unstakeHandler(event: Unstaked): void {
    // define contracts
    let stakingPackage = StakingPackage.bind(Address.fromString(Constants.STAKING_CONTRACT))
    let stakingGetter = StakingGetter.bind(Address.fromString(Constants.STAKING_GETTER))
    let vfthmToken = ERC20.bind(Address.fromString(Constants.VFTHM))

    // update staker data
    let staker = Staker.load(event.params.account.toHexString())
    if (staker != null) {
        // call contract to set TOTAL STAKED FOR USER
        staker.totalStaked = stakingGetter.getUserTotalDeposit(event.params.account)
        // call VFTHM contract to get balance for user
        staker.accruedVotes = vfthmToken.balanceOf(event.params.account)
    }

    // update protocol stats
    let protocolStats = ProtocolStat.load(Constants.STAKING_CONTRACT)
    if (protocolStats != null) {
        // call contract to set TOTAL STAKED FOR PROTOCOL 
        protocolStats.totalStakeFTHM = stakingPackage.totalAmountOfStakedToken();
        protocolStats.totalVotes = stakingPackage.totalAmountOfVoteToken();
        protocolStats.totalUnstakeEvents = protocolStats.totalUnstakeEvents.plus(BigInt.fromString('1'))
        protocolStats.save()

        // store UnstakedEvent data
        let unstakedEvent = new UnstakedEvent(protocolStats.totalUnstakeEvents.toString())
        unstakedEvent.account = event.params.account
        unstakedEvent.amount = event.params.amount
        unstakedEvent.lockId = event.params.lockId
        unstakedEvent.blockNumber = event.block.number
        unstakedEvent.blockTimestamp = event.block.timestamp
        unstakedEvent.transaction = event.transaction.hash
        unstakedEvent.save()
        completeUnstake(event.params.account,event.params.lockId)
    }
    
}

export function partialUnstakeHandler(event: Unstaked): void {
    // define contracts
    let stakingPackage = StakingPackage.bind(Address.fromString(Constants.STAKING_CONTRACT))
    let stakingGetter = StakingGetter.bind(Address.fromString(Constants.STAKING_GETTER))
    let vfthmToken = ERC20.bind(Address.fromString(Constants.VFTHM))

    // update staker data
    let staker = Staker.load(event.params.account.toHexString())
    if (staker != null) {
        // call contract to set TOTAL STAKED FOR USER
        staker.totalStaked = stakingGetter.getUserTotalDeposit(event.params.account)
        // call VFTHM contract to get balance for user
        staker.accruedVotes = vfthmToken.balanceOf(event.params.account)
    }

    // update protocol stats
    let protocolStats = ProtocolStat.load(Constants.STAKING_CONTRACT)
    if (protocolStats != null) {
        // call contract to set TOTAL STAKED FOR PROTOCOL 
        protocolStats.totalStakeFTHM = stakingPackage.totalAmountOfStakedToken();
        protocolStats.totalVotes = stakingPackage.totalAmountOfVoteToken();
        protocolStats.totalUnstakeEvents = protocolStats.totalUnstakeEvents.plus(BigInt.fromString('1'))
        protocolStats.save()

        // store UnstakedEvent data
        let unstakedEvent = new UnstakedEvent(protocolStats.totalUnstakeEvents.toString())
        unstakedEvent.account = event.params.account
        unstakedEvent.amount = event.params.amount
        unstakedEvent.lockId = event.params.lockId
        unstakedEvent.blockNumber = event.block.number
        unstakedEvent.blockTimestamp = event.block.timestamp
        unstakedEvent.transaction = event.transaction.hash
        unstakedEvent.save()
        partialUnstakeLockPosition(event.params.account,event.params.lockId, event.params.amount)
    }
    
}
export function pendingHandler(event: Pending): void {
   // Pending(uint256 indexed streamId, address indexed account, uint256 indexed pendings);
   let staker = Staker.load(event.params.account.toHexString())
   if (staker != null){
        staker.claimedAmount = event.params.pendings
   }
}

export function streamCreatedHandler(event: StreamCreated): void {
    let stream  = new Stream(event.params.streamId.toHexString())
    let stakingPackage = StakingPackage.bind(Address.fromString(Constants.STAKING_CONTRACT))
    let schedule = stakingPackage.getStreamSchedule(event.params.streamId)
    stream.time = schedule.getScheduleTimes()
    stream.reward = schedule.getScheduleRewards()
}


function completeUnstake(account: Bytes, lockId: BigInt): void{
    let staker = Staker.load(account.toHexString())
    if (staker != null) {
        let lengthOfLockPositions = staker.lockPositions.length
        if(lengthOfLockPositions>0){
            let lastLockPosition = staker.lockPositions[lengthOfLockPositions - 1]
            //TODO: Check this again
            let lockIdInt = lockId.toI32();
            staker.lockPositions[lockIdInt - 1] = lastLockPosition
            staker.lockPositions.pop()
            staker.save()
        }
    }
}

function partialUnstakeLockPosition(account: Bytes, lockId: BigInt, amount: BigInt):void{
    let staker = Staker.load(account.toHexString())
    if (staker != null) {
        let lockIdInt = lockId.toI32();
        let unstakedLockPosition = staker.lockPositions[lockIdInt - 1]
        //TODO Subtract amount from lockposition.amount
        
    }
}

function getAPR(streamId: BigInt): void{
    // const getOneDayReward = (streamId) => {
    //     const streamSchedule = await staking.getStreamSchedule(streamId)
    //     const now = Math.floor(Date.now() / 1000)
    //     const oneDay = 86400
    //     const streamStart = schedule[0][0].toNumber()
    //     const streamEnd = schedule[0][schedule[0].length - 1].toNumber()
    //     if (now <= streamStart) return ethers.BigNumber.from(0) // didn't start
    //     if (now >= streamEnd - oneDay) return ethers.BigNumber.from(0) // ended
    //     const currentIndex = schedule[0].findIndex(indexTime => now < indexTime) - 1
    //     const indexDuration = schedule[0][currentIndex + 1] - schedule[0][currentIndex]
    //     const indexRewards = schedule[1][currentIndex].sub(schedule[1][currentIndex + 1])
    //     const oneDayReward = indexRewards.mul(oneDay).div(indexDuration)
    //     return oneDayReward
    // }
    // ```
    
    // APR calculation:
    // ```js
    //     const oneDayReward = await getOneDayReward(streamId)
    //     const totalStaked = await staking.getTotalAmountOfStakedAurora()
    
    //     // streamTokenPrice can be queried from coingecko.
    //     const totalStakedValue = Number(ethers.utils.formatUnits(totalStaked, 18)) * streamTokenPrice
    //     const oneYearStreamRewardValue = Number(ethers.utils.formatUnits(oneDayReward, 18)) * 365 * streamTokenPrice
    //     const streamAPR = oneYearStreamRewardValue * 100 / totalStakedValue
    //     const totalAPR = allStreamsCumulatedOneYearRewardValue * 100 / totalStakedValue  
}

function getDailyRewards(): void {
    
}





