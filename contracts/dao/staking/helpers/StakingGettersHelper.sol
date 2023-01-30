// Copyright SECURRENCY INC.
// SPDX-License-Identifier: AGPL 3.0
pragma solidity 0.8.13;

import "./IStakingHelper.sol";
import "./IStakingGetterHelper.sol";
import "../interfaces/IStakingGetter.sol";
import "../StakingStructs.sol";
import "../../../common/access/AccessControl.sol";

contract StakingGettersHelper is IStakingGetterHelper, AccessControl {
    address private stakingContract;
    uint256 public constant WEIGHT_SLOT = 14; // the storage slot in staking contract where WEIGHT resides
    constructor(address _stakingContract, address admin) {
        stakingContract = _stakingContract;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function getLockInfo(address account, uint256 lockId) public view override returns (LockedBalance memory) {
        LockedBalance[] memory locks = _getAllLocks(account);
        require(lockId <= locks.length, "out of index");
        require(lockId > 0, "lockId cant be 0");
        return locks[lockId - 1];
    }

    function getLocksLength(address account) public view override returns (uint256) {
        LockedBalance[] memory locks = _getAllLocks(account);
        return locks.length;
    }
    function getWeight() public view override returns (Weight memory) {
        return _getWeight();
    }

    function getLock(address account, uint256 lockId)
        public
        view
        override
        returns (
            uint128,
            uint128,
            uint128,
            uint64,
            address
        )
    {
        LockedBalance[] memory locks = _getAllLocks(account);
        LockedBalance memory lock = locks[lockId - 1];
        require(lockId <= locks.length, "out of index");
        require(lockId > 0, "lockId cant be 0");
        return (lock.amountOfToken, lock.amountOfVoteToken, lock.positionStreamShares, lock.end, lock.owner);
    }

    function getUserTotalDeposit(address account) public view override returns (uint256) {
        LockedBalance[] memory locks = _getAllLocks(account);
        if (locks.length == 0) {
            return 0;
        }
        uint256 totalDeposit = 0;
        for (uint256 lockId = 1; lockId <= locks.length; lockId++) {
            totalDeposit += locks[lockId - 1].amountOfToken;
        }
        return totalDeposit;
    }

    function getStreamClaimableAmount(uint256 streamId, address account) public view override returns (uint256) {
        LockedBalance[] memory locks = _getAllLocks(account);
        if (locks.length == 0) {
            return 0;
        }
        uint256 totalRewards = 0;
        for (uint256 lockId = 1; lockId <= locks.length; lockId++) {
            totalRewards += IStakingHelper(stakingContract).getStreamClaimableAmountPerLock(streamId, account, lockId);
        }
        return totalRewards;
    }

    function getUserTotalVotes(address account) public view override returns (uint256) {
        LockedBalance[] memory locks = _getAllLocks(account);
        if (locks.length == 0) {
            return 0;
        }
        uint256 totalVotes = 0;
        for (uint256 lockId = 1; lockId <= locks.length; lockId++) {
            totalVotes += locks[lockId - 1].amountOfVoteToken;
        }
        return totalVotes;
    }

    function getFeesForEarlyUnlock(uint256 lockId, address account) public view override returns (uint256) {
        LockedBalance[] memory locks = _getAllLocks(account);
        require(lockId <= locks.length, "out of index");
        LockedBalance memory lock = locks[lockId - 1];
        require(lockId > 0, "lockId cant be 0");
        require(lock.end > block.timestamp, "lock opened, no penalty");

        uint256 amount = lock.amountOfToken;
        uint256 lockEnd = lock.end;
        uint256 weighingCoef = _weightedPenalty(lockEnd, block.timestamp);
        uint256 penalty = (weighingCoef * amount) / 100000;
        return penalty;
    }

    
    function _getAllLocks(address account) internal view returns(LockedBalance[] memory) {
        return IStakingHelper(stakingContract).getAllLocks(account);
    }
    function _weightedPenalty(uint256 lockEnd, uint256 timestamp) internal view returns (uint256) {
        Weight memory weight = _getWeight();
        uint256 maxLockPeriod = IStakingHelper(stakingContract).maxLockPeriod();
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
    function _getWeight() internal view returns (Weight memory) {
        bytes32 weight = IStakingHelper(stakingContract).readBySlot(WEIGHT_SLOT);
        uint32 penaltyWeightMultiplier;
        uint32 minWeightPenalty;
        uint32 maxWeightPenalty;
        uint32 minWeightShares;
        uint32 maxWeightShares; 
        assembly {
            let value := weight
            maxWeightShares := and(0xffffffff, value)
            //shift right by 32 then, do and by 32 bits to get the value
            let  minWeightShares_shifted:= shr(32,value)
            minWeightShares := and(0xffffffff, minWeightShares_shifted)
            //shift right by 64 then, do and by 32 bits to get the value
            let maxWeightPenalty_shifted := shr(64,value)
            maxWeightPenalty := and(0xffffffff, maxWeightPenalty_shifted)
            //shift right by 96 then, do and by 32 bits to get the value
            let minWeightPenalty_shifted := shr(96,value)
            minWeightPenalty := and(0xffffffff, minWeightPenalty_shifted)
            //shift right by 128 then, do and by 32 bits to get the value
            let penaltyWeightMultiplier_shifted := shr(128,value)
            penaltyWeightMultiplier := and(0xffffffff, penaltyWeightMultiplier_shifted)
        }
        return Weight(
            maxWeightShares,
            minWeightShares,
            maxWeightPenalty,
            minWeightPenalty,
            penaltyWeightMultiplier
        );
    }
}
