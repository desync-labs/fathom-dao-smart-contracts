// SPDX-License-Identifier: AGPL 3.0
// Original Copyright Aurora
// Copyright Fathom 2022

pragma solidity 0.8.13;

import "../StakingStorage.sol";
import "../interfaces/IStakingGetter.sol";
import "./StakingInternals.sol";

contract StakingGetters is StakingStorage, IStakingGetter, StakingInternals {

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

    function readBySlot(uint256 slot) external view override returns(bytes32 value) {
        assembly {
            value := sload(slot)
        }
    }

    function getAddressToList(uint256 slot,uint256 index, address account) external view override returns(bytes memory value){
        bytes32 location = keccak256(abi.encode(keccak256(abi.encode(account, slot))));
        assembly {
            value := sload(add(location,index))
        }
    }

    // function getStream(uint256 streamId)
    //     external
    //     view
    //     override
    //     returns (
    //         address streamOwner,
    //         address rewardToken,
    //         uint256 rewardDepositAmount,
    //         uint256 rewardClaimedAmount,
    //         uint256 maxDepositAmount,
    //         uint256 rps,
    //         uint256 tau,
    //         StreamStatus status
    //     )
    // {
    //     Stream storage stream = streams[streamId];
    //     return (
    //         stream.owner,
    //         stream.rewardToken,
    //         stream.rewardDepositAmount,
    //         stream.rewardClaimedAmount,
    //         stream.maxDepositAmount,
    //         stream.rps,
    //         stream.tau,
    //         stream.status
    //     );
    // }

}
