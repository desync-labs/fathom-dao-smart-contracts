// SPDX-License-Identifier: AGPL 3.0
// Original Copyright Aurora
// Copyright Fathom 2022

pragma solidity 0.8.16;

import "../StakingStorage.sol";
import "../interfaces/IStakingGetter.sol";
import "./StakingInternals.sol";

contract StakingGetters is StakingStorage, IStakingGetter, StakingInternals {
    function getUsersPendingRewards(address account, uint256 streamId) external override view returns (uint256) {
        return users[account].pendings[streamId];
    }
    function getStreamClaimableAmountPerLock(
        uint256 streamId,
        address account,
        uint256 lockId
    ) external view override returns (uint256) {
        require(streams[streamId].status == StreamStatus.ACTIVE, "stream inactive");
        require(lockId <= locks[account].length, "bad index");
        uint256 latestRps = _getLatestRewardsPerShare(streamId);
        User storage userAccount = users[account];
        LockedBalance storage lock = locks[account][lockId - 1];
        uint256 userRpsPerLock = userAccount.rpsDuringLastClaimForLock[lockId][streamId];
        uint256 userSharesOfLock = lock.positionStreamShares;
        return ((latestRps - userRpsPerLock) * userSharesOfLock) / RPS_MULTIPLIER;
    }

    
    function getAllLocks(address account) external override view returns (LockedBalance[] memory) {
        return locks[account];
    }
    function getStreamSchedule(uint256 streamId) external override view returns (uint256[] memory scheduleTimes, uint256[] memory scheduleRewards) {
        return (streams[streamId].schedule.time, streams[streamId].schedule.reward);
    }

    function getStream(
        uint256 streamId
    )
        external
        override
        view
        returns (
            uint256 rewardDepositAmount,
            uint256 rewardClaimedAmount,
            uint256 rps,
            StreamStatus status
        )
    {
        Stream storage stream = streams[streamId];
        return (
            stream.rewardDepositAmount,
            stream.rewardClaimedAmount,
            stream.rps,
            stream.status
        );
    }
    
}
