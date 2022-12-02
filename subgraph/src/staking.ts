import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Staked, Unstaked, StakingPackage } from "../generated/StakingPackage/StakingPackage"
import { StakedEvent, UnstakedEvent, Staker, ProtocolStat} from "../generated/schema";
import { StakingGetter } from "../generated/StakingPackage/StakingGetter"
import { ERC20 } from "../generated/StakingPackage/ERC20"
import { Constants } from "./Utils/Constants"

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
   
    // Update staker (create staker if first stake for account)
    let staker = Staker.load(event.params.account.toHexString())
    if (staker == null) {
        staker = new Staker(event.params.account.toHexString())
        staker.address = event.params.account
        staker.totalStaked = BigInt.fromString('0')
        staker.accruedRewards = BigInt.fromString('0')
        staker.accruedVotes = BigInt.fromString('0')
    }

    let stakingPackage = StakingPackage.bind(Address.fromString(Constants.STAKING_CONTRACT))
    let stakingGetter = StakingGetter.bind(Address.fromString(Constants.STAKING_GETTER))
    let vfthmToken = ERC20.bind(Address.fromString(Constants.VFTHM))

    // call contract to set TOTAL STAKED FOR USER
   staker.totalStaked = stakingGetter.getUserTotalDeposit(Address.fromBytes(staker.address))

   // call VFTHM contract to get balance for user
   staker.accruedVotes = vfthmToken.balanceOf(Address.fromBytes(staker.address))

    // call contract to set TOTAL STAKED FOR PROTOCOL 
    
    protocolStats.totalStakeFTHM = stakingPackage.totalAmountOfStakedMAINTkn();
    protocolStats.totalVotes = stakingPackage.totalAmountOfveMAINTkn();
    protocolStats.save()

    stakedEvent.staker = event.params.account.toHexString()
    stakedEvent.save()

    staker.save()
}

export function unstakeHandler(event: Unstaked): void {

    let stakingPackage = StakingPackage.bind(Address.fromString(Constants.STAKING_CONTRACT))
    let stakingGetter = StakingGetter.bind(Address.fromString(Constants.STAKING_GETTER))
    let vfthmToken = ERC20.bind(Address.fromString(Constants.VFTHM))

    let staker = Staker.load(event.params.account.toHexString())
    if (staker != null) {
        // call contract to set TOTAL STAKED FOR USER
        staker.totalStaked = stakingGetter.getUserTotalDeposit(event.params.account)
        // call VFTHM contract to get balance for user
        staker.accruedVotes = vfthmToken.balanceOf(event.params.account)
    }

    let protocolStats = ProtocolStat.load(Constants.STAKING_CONTRACT)
    if (protocolStats != null) {
        // call contract to set TOTAL STAKED FOR PROTOCOL 
        protocolStats.totalStakeFTHM = stakingPackage.totalAmountOfStakedMAINTkn();
        protocolStats.totalVotes = stakingPackage.totalAmountOfveMAINTkn();
        protocolStats.totalUnstakeEvents = protocolStats.totalUnstakeEvents.plus(BigInt.fromString('1'))
        protocolStats.save()

        let unstakedEvent = new UnstakedEvent(protocolStats.totalUnstakeEvents.toString())
        unstakedEvent.account = event.params.account
        unstakedEvent.amount = event.params.amount
        unstakedEvent.lockId = event.params.lockId
        unstakedEvent.blockNumber = event.block.number
        unstakedEvent.blockTimestamp = event.block.timestamp
        unstakedEvent.transaction = event.transaction.hash
        unstakedEvent.save()
    }


    
}

