import { Address, BigInt, Bytes, log} from "@graphprotocol/graph-ts";
import { Staked, Unstaked, StakingPackage, Pending, StreamCreated, PartialUnstaked } from "../generated/StakingPackage/StakingPackage"
import { StakedEvent, UnstakedEvent, Staker, ProtocolStat, LockPosition, Stream} from "../generated/schema";
import { ERC20 } from "../generated/StakingPackage/ERC20"
import { Constants } from "./utils/constants"


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
    stakedEvent.amount = event.params.amount
    stakedEvent.streamShares = event.params.streamShares
    stakedEvent.nVoteToken = event.params.nVoteToken
    stakedEvent.lockId = event.params.lockId
    stakedEvent.blockNumber = event.block.number
    stakedEvent.blockTimestamp = event.block.timestamp
    stakedEvent.transaction = event.transaction.hash

    let lockPosition = new LockPosition(protocolStats.totalStakeEvents.toString())
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
        staker.claimedAmount = BigInt.fromString('0')
        staker.lockPositionCount = BigInt.fromString('0')
        staker.lockPositionIds = []
    }
    let lockPositionIds = staker.lockPositionIds
    lockPositionIds.push(protocolStats.totalStakeEvents.toString())
    staker.lockPositionIds = lockPositionIds

    // define contracts
    let stakingPackage = StakingPackage.bind(Address.fromString(Constants.STAKING_CONTRACT))
    let vfthmToken = ERC20.bind(Address.fromString(Constants.VFTHM))

    // add amount to user's total staked
    staker.totalStaked = staker.totalStaked.plus(event.params.amount)
    staker.lockPositionCount = staker.lockPositionCount.plus(BigInt.fromString('1'));

    // call VFTHM contract to get balance for user
    staker.accruedVotes = vfthmToken.balanceOf(Address.fromBytes(staker.address))

    // add amount to overall total staked
    protocolStats.totalStakeFTHM = protocolStats.totalStakeFTHM.plus(event.params.amount)
    protocolStats.totalVotes = stakingPackage.totalAmountOfVoteToken();
    const streamId = BigInt.fromString('0') //fthm Stream
    protocolStats.stakingAPR = getAPR(streamId,event.block.timestamp)
    protocolStats.oneDayRewards = getOneDayReward(streamId,event.block.timestamp)
    protocolStats.save()

    // set staker
    stakedEvent.staker = event.params.account.toHexString()
    lockPosition.staker = event.params.account.toHexString()
    stakedEvent.save()
    lockPosition.save()
    staker.save()
}

export function unstakeHandler(event: Unstaked): void {
    // define contracts
    let stakingPackage = StakingPackage.bind(Address.fromString(Constants.STAKING_CONTRACT))
    let vfthmToken = ERC20.bind(Address.fromString(Constants.VFTHM))

    // update staker data
    let staker = Staker.load(event.params.account.toHexString())
    if (staker != null) {
        // subtract amount from user's total staked
        staker.totalStaked = staker.totalStaked.minus(event.params.amount)
        // call VFTHM contract to get balance for user
        staker.accruedVotes = vfthmToken.balanceOf(event.params.account)
        staker.save()
    }

    // update protocol stats
    let protocolStats = ProtocolStat.load(Constants.STAKING_CONTRACT)
    if (protocolStats != null) {
        // subtract amount from overall total staked
        protocolStats.totalStakeFTHM = protocolStats.totalStakeFTHM.minus(event.params.amount);
        protocolStats.totalVotes = stakingPackage.totalAmountOfVoteToken();
        protocolStats.totalUnstakeEvents = protocolStats.totalUnstakeEvents.plus(BigInt.fromString('1'))
        const streamId = BigInt.fromString('0')//fthm Stream
       
        protocolStats.stakingAPR = getAPR(streamId,event.block.timestamp)
        protocolStats.oneDayRewards = getOneDayReward(streamId,event.block.timestamp)
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


export function partialUnstakeHandler(event: PartialUnstaked): void {
    // define contracts
    let stakingPackage = StakingPackage.bind(Address.fromString(Constants.STAKING_CONTRACT))
    let vfthmToken = ERC20.bind(Address.fromString(Constants.VFTHM))

    // update staker data
    let staker = Staker.load(event.params.account.toHexString())
    if (staker != null) {
        // subtract amount from staker's total staked
        staker.totalStaked = staker.totalStaked.minus(event.params.amount)

        // call VFTHM contract to get balance for user
        staker.accruedVotes = vfthmToken.balanceOf(event.params.account)
        staker.save()
    }

    // update protocol stats
    let protocolStats = ProtocolStat.load(Constants.STAKING_CONTRACT)
    if (protocolStats != null) {
        // subtract amount from overall total staked
        protocolStats.totalStakeFTHM = protocolStats.totalStakeFTHM.minus(event.params.amount);
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
        staker.save()
   }
}


export function streamCreatedHandler(event: StreamCreated): void {
    log.info('streamCreatedHandler getting called?',[])
    let stream  = new Stream(event.params.streamId.toHexString())
    let stakingPackage = StakingPackage.bind(Address.fromString(Constants.STAKING_CONTRACT))
    log.info('stream id {}',[event.params.streamId.toString()])
    let schedule = stakingPackage.getStreamSchedule(event.params.streamId)
    let streamData = stakingPackage.getStream(event.params.streamId)
    log.info('schedule times {}',[schedule.getScheduleTimes().toString()])
    stream.time = schedule.getScheduleTimes()
    stream.reward = schedule.getScheduleRewards()
    stream.cooldownPeriod = streamData.getTau()
    stream.save()
}


function completeUnstake(account: Bytes, lockId: BigInt): void{
    let staker = Staker.load(account.toHexString())
    log.info('completeUnstake',[])
    if (staker != null) {
        log.info('User with id {} Found',[account.toHexString()])
        let lengthOfLockPositions = staker.lockPositionIds.length
        if (lengthOfLockPositions > 0){
            log.info('lengthOfLockPositions is {}',[lengthOfLockPositions.toString()])
            let lastLockPositionIndex = staker.lockPositionIds[lengthOfLockPositions - 1]
            let lastLockPosition = LockPosition.load(lastLockPositionIndex)
            let lockIdInt = lockId.toI32();
            let lockPositionIds = staker.lockPositionIds 
            let lockPosition = LockPosition.load(lockPositionIds[lockIdInt - 1])
            
            lockPositionIds[lockIdInt - 1] = lastLockPositionIndex
            lockPositionIds.pop()
            staker.lockPositionIds = lockPositionIds
            if (lockPosition != null && lastLockPosition != null){
                lockPosition.staker = null;
                lockPosition.account = null;
                lastLockPosition.lockId = lockPosition.lockId
                lastLockPosition.save()
                lockPosition.save()            
            }
            staker.lockPositionCount = staker.lockPositionCount.minus(BigInt.fromString('1'))
            staker.save()
        }
        
    }
 }

function partialUnstakeLockPosition(account: Bytes, lockId: BigInt, amount: BigInt):void{
    log.info('Partial Unstake for {} account',[account.toHexString()])
    let staker = Staker.load(account.toHexString())
    if (staker != null) {
        let lockIdInt = lockId.toI32();
        let unstakedLockPositionId = staker.lockPositionIds[lockIdInt -1]
        let unstakedLockPosition = LockPosition.load(unstakedLockPositionId)
        if(unstakedLockPosition != null){
            unstakedLockPosition.amount = unstakedLockPosition.amount.minus(amount)
            unstakedLockPosition.save()
        }
        
        staker.save()
    }
}

function getOneDayReward(streamId: BigInt, now: BigInt):BigInt{
    let stream  = Stream.load(streamId.toHexString())
    const oneDay = BigInt.fromString('86400')
    if (stream != null){
        const streamStart = stream.time[0]
        const streamEnd = stream.time[stream.time.length -1]
        if (now.le(streamStart)){
            return BigInt.fromString('0')
        }
    
        if (now.ge(streamEnd.minus(oneDay))){
            return BigInt.fromString('0')
        }
        const streamTime = stream.time
        let currentIndex = 0
        while(now.le(streamTime[currentIndex])){
            currentIndex++
        }
        const indexDuration = stream.time[currentIndex + 1].minus(stream.time[currentIndex])
        const indexRewards = stream.reward[currentIndex].minus(stream.reward[currentIndex + 1])
        const oneDayReward = indexRewards.times(oneDay).div(indexDuration)
        return oneDayReward
    }
    return BigInt.fromString('0')
}

function getAPR(streamId: BigInt, now: BigInt): BigInt{
    const oneDayReward = getOneDayReward(streamId,now)
    let stakingPackage = StakingPackage.bind(Address.fromString(Constants.STAKING_CONTRACT))
    //TODO: Fetch from the Graph Itself?
    const totalStakedValue = stakingPackage.totalAmountOfStakedToken()
    const oneYearValue = BigInt.fromString('365')
    const HundredPercent = BigInt.fromString('100')
    
    const oneYearStreamRewardValue = oneDayReward.times(Constants.WAD).times(oneYearValue)
    const streamAPR = oneYearStreamRewardValue.div(totalStakedValue).times(HundredPercent)
    //TODO: ADD .div by Constants.WAD (but its not float so all the decimals are not shown)
    return streamAPR
}



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
// ```


//{"vFTHM":"0xd81A5Cb1BAdB6a49f3b9B531a581372AF5aEE014","timelockController":"0xb03C179eC57FB5e30294fB6C03aFBbE865CCad6C","multiSigWallet":"0xEd375e64D3E84634B9eB223dEE3BB26DbbcAf3d3","fthmToken":"0xCABd991B08ec1A844b29dDA1Aac697D6ab030e8d","fthmGovernor":"0x456F87A25d7F24a7aE8191c2319EfD01fb3161E3","stakingImplementation":"0xF3AC60c0cE0547d5a6e0dabda395a555774Bb9b7","vaultImplementation":"0x9201C5E5E1cf6f6D67B26586182979c0C4c4e053","rewardsCalculator":"0xBE2540627dC3228511DBB6209C7979f09cEF17E2","stakingProxyAdmin":"0xA808346A3Db2Faa079422c8a9c71a54be6748F35","staking":"0x45Ef978f70F54eE12149a44128cBe1DBF5040335","vaultProxyAdmin":"0x8D87AA905eBbe6CF4054c6E44107A13a98469397","vault":"0xEb24c0d42003F5c007132EC36E44bAf30bc0dEa4","stakingGetter":"0xF1ef4b91C88E2F37F292497A71D2C083E88FE988"}
