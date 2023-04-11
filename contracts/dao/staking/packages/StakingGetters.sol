// SPDX-License-Identifier: AGPL 3.0
// Original Copyright Aurora
// Copyright Fathom 2022

pragma solidity 0.8.16;

import "../StakingStorage.sol";
import "../interfaces/IStakingGetter.sol";
import "./StakingInternals.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract StakingGetters is StakingStorage, IStakingGetter, StakingInternals,AccessControlUpgradeable {
    error StreamInactiveError();
    error BadIndexError();
    
    function getUsersPendingRewards(address account, uint256 streamId) external view override returns (uint256) {
        return users[account].pendings[streamId];
    }

    function getStreamClaimableAmountPerLock(uint256 streamId, address account, uint256 lockId) external view override returns (uint256) {
        if (streams[streamId].status != StreamStatus.ACTIVE) {
            revert StreamInactiveError();
        }
        if (lockId > locks[account].length) {
            revert BadIndexError();
        }
        uint256 latestRps = _getLatestRewardsPerShare(streamId);
        User storage userAccount = users[account];
        LockedBalance storage lock = locks[account][lockId - 1];
        uint256 userRpsPerLock = userAccount.rpsDuringLastClaimForLock[lockId][streamId];
        uint256 userSharesOfLock = lock.positionStreamShares;
        return ((latestRps - userRpsPerLock) * userSharesOfLock) / RPS_MULTIPLIER;
    }

    function readBySlot(uint256 slot) external view onlyRole(STAKING_GETTER_HELPER_ROLE) override returns(bytes32 value) {
        assembly {
            value := sload(slot)
        }
    }

    function getStreamSchedule(uint256 streamId) external view override returns (uint256[] memory scheduleTimes, uint256[] memory scheduleRewards) {
        return (streams[streamId].schedule.time, streams[streamId].schedule.reward);
    }

    function getStream(
        uint256 streamId
    ) external view override returns (uint256 rewardDepositAmount, uint256 rewardClaimedAmount, uint256 rps, StreamStatus status) {
        Stream storage stream = streams[streamId];
        return (stream.rewardDepositAmount, stream.rewardClaimedAmount, stream.rps, stream.status);
    }
}
