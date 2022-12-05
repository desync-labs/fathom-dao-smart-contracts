import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Staked, Unstaked, StakingPackage, Pending } from "../generated/StakingPackage/StakingPackage"
import { StakedEvent, UnstakedEvent, Staker, ProtocolStat, LockPosition} from "../generated/schema";
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
    stakedEvent.nVoteToken = event.params.nVEMainTkn
    stakedEvent.lockId = event.params.lockId
    stakedEvent.blockNumber = event.block.number
    stakedEvent.blockTimestamp = event.block.timestamp
    stakedEvent.transaction = event.transaction.hash

    let lockPosition = new LockPosition(event.params.account)
    lockPosition.account = event.params.account
    lockPosition.streamShares = event.params.streamShares
    lockPosition.nVoteToken = event.params.nVEMainTkn
    //TODO Add amount
    lockPosition.lockId = event.params.lockId
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
    protocolStats.totalStakeFTHM = stakingPackage.totalAmountOfStakedMAINTkn();
    protocolStats.totalVotes = stakingPackage.totalAmountOfveMAINTkn();
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
        protocolStats.totalStakeFTHM = stakingPackage.totalAmountOfStakedMAINTkn();
        protocolStats.totalVotes = stakingPackage.totalAmountOfveMAINTkn();
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
        protocolStats.totalStakeFTHM = stakingPackage.totalAmountOfStakedMAINTkn();
        protocolStats.totalVotes = stakingPackage.totalAmountOfveMAINTkn();
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

function getAPR(): void{
    
}

function getDailyRewards(): void {
    
}





