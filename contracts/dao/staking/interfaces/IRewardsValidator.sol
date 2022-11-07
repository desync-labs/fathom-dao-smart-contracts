// SPDX-License-Identifier: AGPL 3.0
// Copyright Fathom 2022

pragma solidity ^0.8.13;
import "../StakingStructs.sol";

interface IRewardsValidator {
    function _validateStreamParameters(
        address streamOwner,
        address rewardToken,
        uint256 maxDepositAmount,
        uint256 minDepositAmount,
        uint256[] memory scheduleTimes,
        uint256[] memory scheduleRewards,
        uint256 tau) external view;

    function _getRewardsAmount(Stream memory stream, uint256 lastUpdate) external view returns (uint256);
}
