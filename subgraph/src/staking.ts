import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Staked, Unstaked, StakingPackage, Pending, StreamCreated } from "../generated/StakingPackage/StakingPackage"
import { StakedEvent, UnstakedEvent, Staker, ProtocolStat, LockPosition, Stream} from "../generated/schema";
import { StakingGetter } from "../generated/StakingPackage/StakingGetter"
import { ERC20 } from "../generated/StakingPackage/ERC20"
import { Constants } from "./Utils/Constants"
//TODO Still:
//APR -Subik -Easy -> Done
//Daily Rewards - Subik - Easy -> Done
//Get Fees - Subik // Can we call? - Tricky. Ask Zach -> Not Done
//Get Lock Period - Subik// Need to add to event lock period -> Easy -> Add event -> Done
//Use new contracts so that events can be handled in a way that aggregates the values -> Not Done
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
    lockPosition.remainingTime = event.params.end.minus(event.block.timestamp)
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
    const streamId = new BigInt(0) //fthm Stream
    protocolStats.stakingAPR = getAPR(streamId,event.block.timestamp)
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
        const streamId = new BigInt(0) //fthm Stream
        protocolStats.stakingAPR = getAPR(streamId,event.block.timestamp)
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
       // unstakedLockPosition.amount = unstakedLockPosition.amount.minus(amount)
        staker.save()
    }
}

function getOneDayReward(streamId: BigInt, now: BigInt):BigInt{
    let stream  = Stream.load(streamId.toHexString())
    const oneDay = new BigInt(86400)
    if (stream != null){
        const streamStart = stream.time[0]
        const streamEnd = stream.time[stream.time.length -1]
        if (now.le(streamStart)){
            return new BigInt(0)
        }
    
        if (now.ge(streamEnd.minus(oneDay))){
            return new BigInt(0)
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
    return new BigInt(0)  
}

function getAPR(streamId: BigInt, now: BigInt): BigInt{
    const oneDayReward = getOneDayReward(streamId,now)
    let stakingPackage = StakingPackage.bind(Address.fromString(Constants.STAKING_CONTRACT))
    const totalStakedValue = stakingPackage.totalAmountOfStakedToken()
    const oneYearValue = new BigInt(365)
    const HundredPercent = new BigInt(100)
    //const oneYearStreamRewardValue = Number(ethers.utils.formatUnits(oneDayReward, 18)) * 365 * streamTokenPrice
    
    const oneYearStreamRewardValue = oneDayReward.times(Constants.WAD).times(oneYearValue)
    const streamAPR = oneYearStreamRewardValue.div(totalStakedValue).times(HundredPercent)
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


//{"vFTHM":"0x904e791Adf62af3a9741D6581E506608bFb93f96","timelockController":"0xEc797a41BeC2bF4269a687bb1A2C02C8acC6F576","multiSigWallet":"0xCfC08F2235ee1D608fCACbe359a181BD8f443CAf","fthmToken":"0x12be4846D6C00C7eDb5e57Ab6a896AFF7865F467","fthmGovernor":"0x13869c1a4b2244acf733680C4DB108D8a51b4a14","stakingImplementation":"0x2cc7AD2BfF7F909B8124b46FA3508d6984a02870","vaultImplementation":"0xeD6EFA44FAeF9C4593008c855f6AeE58e3e2C1Fc","rewardsCalculator":"0x81B02179971A3fFdBD1d3F49aa19a5c602fa32d3","stakingProxyAdmin":"0xe42f985956c570351a7DCeF82075CF50721922D9","staking":"0x5983b8fB81b0a820BE1137602915Ce40eE21180D","vaultProxyAdmin":"0xe57f399B586886B0281658d757f18b13db6233B2","vault":"0xA5e6F540b7F130cE2774af2745A1A15007bF13de","stakingGetter":"0xd2b08EB54E24C937FcF8040D0f251063d4a65DEc"}s