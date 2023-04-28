// SPDX-License-Identifier: AGPL 3.0
// Copyright Fathom 2022
pragma solidity 0.8.16;
import "../../StakingStructs.sol";
interface IStakingPositionFactory {
    function initialize(
        address _admin,
        address _stakingContract,
        address _mainToken,
        address _stakingPositionImplementation,
        address _voteToken,
        address _proxyAdmin
    ) external;

    function updateStreamRewardToken(
        uint256 streamId,
        address rewardToken
    ) external;

    function createStakingPositionContract(
        address _account
    ) external;

    function updateStakingPositionImplementation(
        address _stakingPositionImplementation
    ) external;

    function updateStakingContract(
        address _stakingContract
    ) external;

    function streamRewardToken(uint256 streamId) external view returns (address);

    function getStakingPositionContractAddress(
        address account
    ) external view returns (address);

    function stakingContract() external view returns (address);
    function mainToken() external view returns (address);
    function voteToken() external view returns (address);
}