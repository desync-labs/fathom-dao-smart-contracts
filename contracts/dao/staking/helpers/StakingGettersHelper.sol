// SPDX-License-Identifier: AGPL 3.0
// Copyright Fathom 2022
pragma solidity 0.8.16;

import "./IStakingHelper.sol";
import "./IStakingGetterHelper.sol";
import "../interfaces/IStakingGetter.sol";
import "../StakingStructs.sol";
import "../../../common/access/AccessControl.sol";

// solhint-disable not-rely-on-time
contract StakingGettersHelper is IStakingGetterHelper, AccessControl {
    uint256 public constant LOCK_SLOT = 19;
    uint256 public constant WEIGHT_SLOT = 16;

    address private stakingContract;

    error LockOpenedError();
    error LockIdOutOfIndexError();
    error LockIdCantBeZeroError();

    constructor(address _stakingContract, address admin) {
        stakingContract = _stakingContract;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function getLocksLength(address account) external view override returns (uint256) {
        LockedBalance[] memory locks = _getAllLocks(account);
        return locks.length;
    }

    function getWeight() external view override returns (Weight memory) {
        return _getWeight();
    }

    function getAllLocks(address account) external view override returns (LockedBalance[] memory) {
        return _getAllLocks(account);
    }

    function getLock(address account, uint256 lockId)
        external
        view
        override
        returns (
            uint128,
            uint128,
            uint64,
            address,
            uint256
        )
    {
        LockedBalance memory lock = getLockInfo(account, lockId);
        return (lock.amountOfToken, lock.positionStreamShares, lock.end, lock.owner, lock.amountOfVoteToken);
    }

    function getUserTotalDeposit(address account) external view override returns (uint256) {
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

    function getStreamClaimableAmount(uint256 streamId, address account) external view override returns (uint256) {
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

    function getUserTotalVotes(address account) external view override returns (uint256) {
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

    function getFeesForEarlyUnlock(uint256 lockId, address account) external view override returns (uint256) {
        LockedBalance memory lock = getLockInfo(account, lockId);
        if (lock.end <= block.timestamp) {
            revert LockOpenedError();
        }

        uint256 amount = lock.amountOfToken;
        uint256 lockEnd = lock.end;
        uint256 weighingCoef = _weightedPenalty(lockEnd, block.timestamp);
        uint256 penalty = (weighingCoef * amount) / 100000;
        return penalty;
    }

    function getLockInfo(address account, uint256 lockId) public view override returns (LockedBalance memory) {
        LockedBalance[] memory locks = _getAllLocks(account);
        if (lockId > locks.length) {
            revert LockIdOutOfIndexError();
        }
        if (lockId == 0) {
            revert LockIdCantBeZeroError();
        }
        return locks[lockId - 1];
    }

    // function _getAllLocks(address account) internal view returns (LockedBalance[] memory) {
    //     return IStakingHelper(stakingContract).getAllLocks(account);
    // }

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

    function _getLock(
        address account,
        uint256 slot,
        uint256 index
    ) internal view returns (LockedBalance memory) {
        uint128 amountOfToken;
        uint128 positionStreamShares;
        uint64 end;
        address owner;
        uint256 amountOfVoteToken;
        //Calculate the location based on account and slot
        uint256 location = uint256(keccak256(abi.encode(keccak256(abi.encode(account, slot)))));
        
        //Read data from StakingContract
        bytes32 amountOfTokenAndPositionStreamSharesBytes = IStakingHelper(stakingContract).readBySlot(location + index * 3);
        bytes32 endAndOwnerBytes = IStakingHelper(stakingContract).readBySlot(location + (index * 3) + 1);
        bytes32 amountOfVoteTokenBytes = IStakingHelper(stakingContract).readBySlot(location + (index * 3) + 2);

        assembly {
            //Extract amountOfVoteToken
            //amount of vote tokens is the last 256 bits of the lock position array
            amountOfVoteToken := amountOfVoteTokenBytes
            //Extract end and owner from endOwnerBytes
            let endAndOwnerValue := endAndOwnerBytes
            //and by 8 bytes to get the value of endBytes only at the end of slot 2
            end := and(endAndOwnerValue, 0xffffffffffffffff)
            //shift by 64 bits to get the value of owner only at the end of slot 2
            let shiftOwnerValue := shr(64, endAndOwnerValue)
            //and by 160 bits to get the value of owner only at the end of slot 2
            owner := and(shiftOwnerValue, 0xffffffffffffffffffffffffffffffffffffffff)
            // Extract amountOfToken and positionStreamShares from amountOfTokenAndPositionStreamSharesBytes
            let amountOfTokenAndPositionStreamSharesValue := amountOfTokenAndPositionStreamSharesBytes
            //and by  128 bits and get value of amountOfToken at ended of slot 3
            amountOfToken := and(amountOfTokenAndPositionStreamSharesValue, 0xffffffffffffffffffffffffffffffff)
            //shift by 128 then, and by  128 bits and get value of amountOfVoteToken at end of slot 3
            let shiftPositionStreamShares := shr(128, amountOfTokenAndPositionStreamSharesValue)
            positionStreamShares := and(shiftPositionStreamShares, 0xffffffffffffffffffffffffffffffff)
        }

        return LockedBalance(amountOfToken, positionStreamShares, end, owner, amountOfVoteToken);
    }


    function _getAllLocks(address account) internal view returns (LockedBalance[] memory) {
        uint256 lengthOfAllLocks = _getTotalLockPositionsLength(LOCK_SLOT, account);
        LockedBalance[] memory lockedBalances = new LockedBalance[](lengthOfAllLocks);
        for (uint256 lockId = 1; lockId <= lengthOfAllLocks; lockId++) {
            lockedBalances[lockId - 1] = _getLock(account, LOCK_SLOT, lockId - 1);
        }
        return lockedBalances;
    }

    function _getTotalLockPositionsLength(uint256 slot, address account) internal view returns (uint256 len) {
        bytes32 lengthLocation = keccak256(abi.encode(account, slot));
        uint256 lengthLocationSlot = uint256(lengthLocation);
        len = uint256(IStakingHelper(stakingContract).readBySlot(lengthLocationSlot));
    }

    function _getWeight() internal view returns (Weight memory) {
        //Read the weight value from staking contract's storage
        bytes32 weightData = IStakingHelper(stakingContract).readBySlot(WEIGHT_SLOT);
        uint32 penaltyWeightMultiplier;
        uint32 minWeightPenalty;
        uint32 maxWeightPenalty;
        uint32 minWeightShares;
        uint32 maxWeightShares;
        assembly {
            //Extract maxWeightShares (first 32 bits) from weightData
            maxWeightShares := and(0xffffffff, weightData)
            //Extract minWeightShares (next 32 bits) from weightData
            //shift right by 32 and do and by 32 bits to get the value
            let shiftMinWeightShares := shr(32,weightData)
            minWeightShares := and(0xffffffff, shiftMinWeightShares)
            //Extract maxWeightPenalty(next 32 bits) from weightData
            //shift right by 64 and do and by 32 bits to get the value
            let shiftMaxWeightPenalty := shr(64,weightData)
            maxWeightPenalty := and(0xffffffff, shiftMaxWeightPenalty)
            //Extract minWeightPenalty (next 32 bits) from weightData
            //shift right by 96 and do and by 32 bits to get the value
            let shiftMinWeightPenalty := shr(96,weightData)
            minWeightPenalty := and(0xffffffff, shiftMinWeightPenalty)
            // Extract penaltyWeightMultiplier (next 32 bits) from weightData
            //shift right by 128 and do and by 32 bits to get the value
            let shiftPenaltyWeightMultiplier := shr(128,weightData)
            penaltyWeightMultiplier := and(0xffffffff, shiftPenaltyWeightMultiplier)
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
