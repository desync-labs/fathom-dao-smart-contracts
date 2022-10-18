// SPDX-License-Identifier: AGPL 3.0
// Original Copyright Aurora
// Copyright Fathom 2022

pragma solidity ^0.8.13;
import "../StakingStorage.sol";
import "../interfaces/IStakingEvents.sol";

contract RewardsInternals is StakingStorage, IStakingEvents {
    // solhint-disable not-rely-on-time
    /**
     @dev Updates the stream rewards schedules.
     @notice This gets called when the stream manager has less rewards token to distribute
             than original max deposit amount
     */
    function _updateStreamsRewardsSchedules(uint256 streamId, uint256 rewardTokenAmount) internal {
        uint256 streamScheduleRewardLength = streams[streamId].schedule.reward.length;
        for (uint256 i = 0; i < streamScheduleRewardLength; i++) {
            streams[streamId].schedule.reward[i] =
                (streams[streamId].schedule.reward[i] * rewardTokenAmount) /
                streams[streamId].maxDepositAmount;
        }
    }

    /**
     @dev Moves the accumulated rewards to pending so that stakers can withdraw rewards
     @notice The rewards are moved based upon streamId and lockId
     */
    function _moveRewardsToPending(
        address account,
        uint256 streamId,
        uint256 lockId
    ) internal {
        LockedBalance storage lock = locks[account][lockId - 1];
        require(streamId != 0, "compound");
        require(streams[streamId].status == StreamStatus.ACTIVE, "inactive");
        User storage userAccount = users[account];
        require(lock.FTHMShares != 0, "No Stake");
        uint256 reward = ((streams[streamId].rps - userAccount.rpsDuringLastClaimForLock[lockId][streamId]) *
            lock.positionStreamShares) / RPS_MULTIPLIER;

        if (reward == 0) return; // All rewards claimed or stream schedule didn't start
        userAccount.pendings[streamId] += reward;
        userAccount.rpsDuringLastClaimForLock[lockId][streamId] = streams[streamId].rps;
        userAccount.releaseTime[streamId] = block.timestamp + streams[streamId].tau;
        // If the stream is blacklisted, remaining unclaimed rewards will be transfered out.
        streams[streamId].rewardClaimedAmount += reward;
        emit Pending(streamId, account, userAccount.pendings[streamId]);
    }
    /**
     * @dev move all the streams rewards for a user to the pending tokens
     * @param account is the staker address
     * @param lockId the lock id of the lock position to move rewards
     */
    function _moveAllStreamRewardsToPending(address account, uint256 lockId) internal {
        uint256 streamsLength = streams.length;
        for (uint256 i = 1; i < streamsLength; i++) {
            if (streams[i].status == StreamStatus.ACTIVE) _moveRewardsToPending(account, i, lockId);
        }
    }

    function _moveAllLockPositionRewardsToPending(address account, uint256 streamId) internal {
        require(streamId != 0, "auto-compound");
        require(streams[streamId].status == StreamStatus.ACTIVE, "inactive");
        LockedBalance[] memory locksOfAccount = locks[account];
        uint256 locksLength = locksOfAccount.length;
        require(locksLength > 0, "no lock position");
        for (uint256 i = 1; i <= locksLength; i++){
            _moveRewardsToPending(account, streamId, i);
        } 
    }
   

    /**
     * @dev This is always called before locking, unlocking, claiming rewards
     * @notice This function updates rewards per share at each call for calculation of rewards
     */
    function _before() internal {
        if (touchedAt == block.timestamp) return; // Already updated by previous transaction
        uint256 streamsLength = streams.length;
        if (totalFTHMShares != 0 && streamsLength != 0) {
            totalAmountOfStakedFTHM += _getRewardsAmount(0, touchedAt);
            for (uint256 i = 1; i < streamsLength; i++) {
                if (streams[i].status == StreamStatus.ACTIVE) {
                    streams[i].rps = _getLatestRewardsPerShare(i);
                }
            }
        }

        touchedAt = block.timestamp;
    }

    function _validateStreamParameters(
        address streamOwner,
        address rewardToken,
        uint256 maxDepositAmount,
        uint256 minDepositAmount,
        uint256[] memory scheduleTimes,
        uint256[] memory scheduleRewards,
        uint256 tau
    ) internal view {
        require(streamOwner != address(0), "bad owner");
        require(rewardToken != address(0), "bad reward token");
        require(maxDepositAmount > 0, "Zero Max Deposit");
        require(minDepositAmount > 0, "Zero Min Deposit");
        require(minDepositAmount <= maxDepositAmount, "Invalid Min Deposit");
        require(
            maxDepositAmount == scheduleRewards[0],
            "Invalid Max Deposit"
        );
        // scheduleTimes[0] == proposal expiration time
        require(scheduleTimes[0] > block.timestamp, "bad expiration");
        require(
            scheduleTimes.length == scheduleRewards.length,
            "bad Schedules"
        );
        require(scheduleTimes.length >= 2, "Schedules short");
        require(tau != 0, "bad Tau");
        for (uint256 i = 1; i < scheduleTimes.length; i++) {
            require(scheduleTimes[i] > scheduleTimes[i - 1], "bad times");
            require(
                scheduleRewards[i] <= scheduleRewards[i - 1],
                "bad Rewards"
            );
        }
        require(
            scheduleRewards[scheduleRewards.length - 1] == 0,
            "bad End Rewards"
        );
    }

    /**
     * @dev calculates and gets the latest released rewards.
     * @param streamId stream index
     * @return rewards released since last update.
     */
    function _getRewardsAmount(uint256 streamId, uint256 lastUpdate) internal view returns (uint256) {
        require(lastUpdate <= block.timestamp, "bad last Update");
        if (lastUpdate == block.timestamp) return 0; // No more rewards since last update
        uint256 streamStart = streams[streamId].schedule.time[0];
        if (block.timestamp <= streamStart) return 0; // Stream didn't start
        uint256 streamEnd = streams[streamId].schedule.time[streams[streamId].schedule.time.length - 1];
        if (lastUpdate >= streamEnd) return 0; // Stream schedule ended, all rewards released
        uint256 start;
        uint256 end;
        if (lastUpdate > streamStart) {
            start = lastUpdate;
        } else {
            // Release rewards from stream start.
            start = streamStart;
        }
        if (block.timestamp < streamEnd) {
            end = block.timestamp;
        } else {
            // The stream already finished between the last update and now.
            end = streamEnd;
        }
        return _rewardsSchedule(streamId, start, end);
    }

    /**
     * @dev calculate the total amount of the released tokens within a period (start & end)
     * @param streamId the stream index
     * @param start is the start timestamp within the schedule
     * @param end is the end timestamp (e.g block.timestamp .. now)
     * @return amount of the released tokens for that period
     */
    function _rewardsSchedule(
        uint256 streamId,
        uint256 start,
        uint256 end
    ) internal view returns (uint256) {
        Schedule storage schedule = streams[streamId].schedule;
        uint256 startIndex;
        uint256 endIndex;
        (startIndex, endIndex) = _startEndScheduleIndex(streamId, start, end);
        uint256 rewardScheduledAmount = 0;
        uint256 reward = 0;
        if (startIndex == endIndex) {
            // start and end are within the same schedule period
            reward = schedule.reward[startIndex] - schedule.reward[startIndex + 1];
            rewardScheduledAmount =
                (reward * (end - start)) /
                (schedule.time[startIndex + 1] - schedule.time[startIndex]);
        } else {
            // start and end are not within the same schedule period
            // Reward during the startIndex period
            // Here reward = starting from the actual start time, calculated for the first schedule period
            // that the rewards start.
            reward = schedule.reward[startIndex] - schedule.reward[startIndex + 1];
            rewardScheduledAmount =
                (reward * (schedule.time[startIndex + 1] - start)) /
                (schedule.time[startIndex + 1] - schedule.time[startIndex]);
            // Here reward = from end of start schedule till beginning of end schedule
            // Reward during the period from startIndex + 1  to endIndex
            rewardScheduledAmount += schedule.reward[startIndex + 1] - schedule.reward[endIndex];
            // Reward at the end schedule where schedule.time[endIndex] '
            reward = schedule.reward[endIndex] - schedule.reward[endIndex + 1];
            rewardScheduledAmount +=
                (reward * (end - schedule.time[endIndex])) /
                (schedule.time[endIndex + 1] - schedule.time[endIndex]);
        }
        return rewardScheduledAmount;
    }

    /**
     * @dev gets start index and end index in a stream schedule
     * @param streamId stream index
     * @param start start time (in seconds)
     * @param end end time (in seconds)
     */
    function _startEndScheduleIndex(
        uint256 streamId,
        uint256 start,
        uint256 end
    ) internal view returns (uint256 startIndex, uint256 endIndex) {
        Schedule storage schedule = streams[streamId].schedule;
        uint256 scheduleTimeLength = schedule.time.length;
        require(scheduleTimeLength > 0, "bad schedules");
        require(end > start, "bad query period");
        require(start >= schedule.time[0], "query before start");
        require(end <= schedule.time[scheduleTimeLength - 1], "query after end");
        for (uint256 i = 1; i < scheduleTimeLength; i++) {
            if (start < schedule.time[i]) {
                startIndex = i - 1;
                break;
            }
        }
        if (end == schedule.time[scheduleTimeLength - 1]) {
            endIndex = scheduleTimeLength - 2;
        } else {
            for (uint256 i = startIndex + 1; i < scheduleTimeLength; i++) {
                if (end < schedule.time[i]) {
                    // Users most often claim rewards within the same index which can last several months.
                    endIndex = i - 1;
                    break;
                }
            }
        }
        require(startIndex <= endIndex, "invalid index");
    }

    /**
     * @dev calculates and gets the latest reward per share (RPS) for a stream
     * @param streamId stream index
     * @return streams[streamId].rps + scheduled reward up till now
     */
    function _getLatestRewardsPerShare(uint256 streamId) internal view returns (uint256) {
        require(totalStreamShares != 0, "No Stream Shares");
        return streams[streamId].rps + (_getRewardsAmount(streamId, touchedAt) * RPS_MULTIPLIER) / totalStreamShares;
    }
}
