// SPDX-License-Identifier: AGPL 3.0
// Copyright Fathom 2022
pragma solidity 0.8.16;
import "../../StakingStructs.sol";
interface IStakingPositionFactory {
    function initialize(
        address _admin,
        address _stakingContract,
        address _mainToken,
        address _stakingPositionImplementation
    ) external;

    function updateStreamRewardToken(
        uint256 streamId,
        address rewardToken
    ) external;

    function createStakingPositionContract(
        address account,
        address proxyAdmin
    ) external;

    function streamRewardToken(uint256 streamId) external view returns (address);
}