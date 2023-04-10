// SPDX-License-Identifier: AGPL 3.0
// Copyright Fathom 2022
pragma solidity 0.8.16;
import "../StakingStructs.sol";

interface ILockPositionContext {
    function initialize(address _admin, address _stakingContract) external;
    function createLockPositionContext(uint256 amount, uint256 lockPeriod, address account) external returns (bytes32);
    function approveLockPositionContext(bytes32 _requestHash) external;
    function executeLockPositionContext(bytes32 _requestHash) external returns (CreateLockParams memory);
}
