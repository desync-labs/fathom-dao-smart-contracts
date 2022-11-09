// Copyright SECURRENCY INC.
// SPDX-License-Identifier: AGPL 3.0
pragma solidity 0.8.13;

import "./IStakingHelper.sol";
import "./IStakingGetterHelper.sol";
import "../interfaces/IStakingGetter.sol";
import "../StakingStructs.sol";
import "../../../common/access/AccessControl.sol";

contract StakingGettersHelper  is IStakingGetterHelper, AccessControl {
     // solhint-disable not-rely-on-time
    address private stakingContract;
    uint256 internal constant ONE_MONTH = 2629746;
    uint256 internal constant ONE_YEAR = 31536000;
    uint256 internal constant WEEK = 604800;
    Weight public weight;

    constructor(address _stakingContract) {
        stakingContract = _stakingContract;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setWeight(Weight memory _weight) public override onlyRole(DEFAULT_ADMIN_ROLE){
        weight = _weight;
    }

    

    function getLockInfo(address account, uint256 lockId) public override view  returns (LockedBalance memory) {
        LockedBalance[] memory locks = _getAllLocks(account);
        require(lockId <= locks.length, "out of index");
        require(lockId > 0,"lockId cant be 0");
        return locks[lockId - 1];
    }

    function getLocksLength(address account) public override view returns (uint256) {
        LockedBalance[] memory locks = _getAllLocks(account);
        return locks.length;
    }

    function getLock(address account, uint lockId) public
                     override view returns(uint128, uint128, uint128, uint128, uint64, address){
        LockedBalance[] memory locks = _getAllLocks(account);
        LockedBalance memory lock = locks[lockId - 1];
        require(lockId <= locks.length, "out of index");
        require(lockId > 0,"lockId cant be 0");
        return(
            lock.amountOfFTHM,
            lock.amountOfveFTHM,
            lock.FTHMShares,
            lock.positionStreamShares,
            lock.end,
            lock.owner
        );
    }


    /// @dev gets the total user deposit
    /// @param account the user address
    /// @return user total deposit in (Main Token)
    function getUserTotalDeposit(address account)
        public
        view
        override
        returns (uint256)
    {   
        LockedBalance[] memory locks = _getAllLocks(account);
        if(locks.length == 0){
            return 0;
        }
        uint totalDeposit = 0;
        for (uint lockId = 1; lockId <= locks.length; lockId++) {
            totalDeposit += locks[lockId - 1].amountOfFTHM;
        }
        return totalDeposit;
    }

    /// @dev gets the total user deposit
    /// @param account the user address
    /// @return user total deposit in (Main Token)
    function getStreamClaimableAmount(uint256 streamId, address account)
        public
        view
        override
        returns (uint256)
    {   
        LockedBalance[] memory locks = _getAllLocks(account);
        if(locks.length == 0){
            return 0;
        }
        uint totalRewards = 0;
        for (uint lockId = 1; lockId <= locks.length; lockId++) {
            totalRewards += IStakingHelper(stakingContract).getStreamClaimableAmountPerLock(streamId, account, lockId);
        }
        return totalRewards;
    }

    /// @dev gets the total user deposit
    /// @param account the user address
    /// @return user total deposit in (Main Token)
    function getUserTotalVotes(address account)
        public
        view
        override
        returns (uint256)
    {   
        LockedBalance[] memory locks = _getAllLocks(account);
        if(locks.length == 0){
            return 0;
        }
        uint totalVotes = 0;
        for (uint lockId = 1; lockId <= locks.length; lockId++) {
            totalVotes += locks[lockId - 1].amountOfveFTHM;
        }
        return totalVotes;
    }

    function getFeesForEarlyUnlock(uint256 lockId, address account) 
        override 
        public 
        view
        returns (uint256)
    {
        LockedBalance[] memory locks = _getAllLocks(account);
        require(lockId <= locks.length, "out of index");
        LockedBalance memory lock = locks[lockId - 1];
        require(lockId > 0,"lockId cant be 0");
        require(lock.end > block.timestamp, "lock opened, no penalty");

        uint256 totalAmountOfStakedFTHM = IStakingHelper(stakingContract).totalAmountOfStakedFTHM();
        uint256 totalFTHMShares = IStakingHelper(stakingContract).totalFTHMShares();

        uint256 amount = (totalAmountOfStakedFTHM * lock.FTHMShares) / totalFTHMShares;
        uint256 lockEnd = lock.end;
        uint256 weighingCoef = _weightedPenalty(lockEnd, block.timestamp);
        uint256 penalty = (weighingCoef * amount) / 100000;
        return penalty;
    }

    function _getAllLocks(address account) internal view returns(LockedBalance[] memory){
        LockedBalance[] memory locks = IStakingHelper(stakingContract).getAllLocks(account);
        return locks;
    }

    function _weightedPenalty(uint256 lockEnd, uint256 timestamp) internal view returns (uint256) {
        uint maxLockPeriod = IStakingHelper(stakingContract).maxLockPeriod();
        uint256 slopeStart = lockEnd;
        if (timestamp >= slopeStart) return 0;
        uint256 remainingTime = slopeStart - timestamp;
        
        //why weight multiplier: Because if a person remaining time is less than 12 hours, the calculation
        //would only give minWeightPenalty, because 2900 * 12hours/4days = 0
        return (weight.penaltyWeightMultiplier *
            weight.minWeightPenalty +
            (weight.penaltyWeightMultiplier * (weight.maxWeightPenalty - weight.minWeightPenalty) * remainingTime) /
            maxLockPeriod);
    }
}
