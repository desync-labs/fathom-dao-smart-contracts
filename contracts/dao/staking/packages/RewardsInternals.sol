// SPDX-License-Identifier: AGPL 3.0
// Original Copyright Aurora
// Copyright Fathom 2022

pragma solidity 0.8.13;
import "../StakingStorage.sol";
import "../interfaces/IStakingEvents.sol";
import "../interfaces/IRewardsHandler.sol";

contract RewardsInternals is StakingStorage, IStakingEvents {
    // solhint-disable not-rely-on-time
    function _updateStreamsRewardsSchedules(uint256 streamId, uint256 rewardTokenAmount) internal {
        uint256 streamScheduleRewardLength = streams[streamId].schedule.reward.length;
        for (uint256 i = 0; i < streamScheduleRewardLength; i++) {
            streams[streamId].schedule.reward[i] =
                (streams[streamId].schedule.reward[i] * rewardTokenAmount) /
                streams[streamId].maxDepositAmount;
        }
    }

    function _moveRewardsToPending(
        address account,
        uint256 streamId,
        uint256 lockId
    ) internal {
        LockedBalance storage lock = locks[account][lockId - 1];
        require(streamId != 0, "compound");
        require(streams[streamId].status == StreamStatus.ACTIVE, "inactive");
        User storage userAccount = users[account];
        require(lock.tokenShares != 0, "No Stake");
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

    function _moveAllStreamRewardsToPending(address account, uint256 lockId) internal {
        uint256 streamsLength = streams.length;
        for (uint256 i = 1; i < streamsLength; i++) {
            if (streams[i].status == StreamStatus.ACTIVE) _moveRewardsToPending(account, i, lockId);
        }
    }

    function _moveAllLockPositionRewardsToPending(address account, uint256 streamId) internal {
        require(streamId != 0, "compound");
        require(streams[streamId].status == StreamStatus.ACTIVE, "inactive");
        LockedBalance[] storage locksOfAccount = locks[account];
        uint256 locksLength = locksOfAccount.length;
        require(locksLength > 0, "no lock");
        for (uint256 i = 1; i <= locksLength; i++){
            _moveRewardsToPending(account, streamId, i);
        }
    }
   
    function _updateStreamRPS() internal {
        if (touchedAt == block.timestamp) return; // Already updated by previous transaction
        if (totalShares != 0) {
            totalAmountOfStakedToken += _getRewardsAmount(0, touchedAt);
            for (uint256 i = 1; i < streams.length; i++) {
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
        IRewardsHandler(rewardsContract).validateStreamParameters(
            streamOwner,
            rewardToken, 
            maxDepositAmount, 
            minDepositAmount, 
            scheduleTimes, 
            scheduleRewards, 
            tau
        );
    }

    function _getRewardsAmount(uint256 streamId, uint256 lastUpdate) internal view returns (uint256) {
        return IRewardsHandler(rewardsContract).getRewardsAmount(streams[streamId].schedule, lastUpdate);
    }

    function _getLatestRewardsPerShare(uint256 streamId) internal view returns (uint256) {
        require(totalStreamShares != 0, "No Stream Shares");
        return streams[streamId].rps + (_getRewardsAmount(streamId, touchedAt) * RPS_MULTIPLIER) / totalStreamShares;
    }
}
