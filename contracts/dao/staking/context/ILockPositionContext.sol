// SPDX-License-Identifier: AGPL 3.0
// Copyright Fathom 2022
pragma solidity 0.8.16;
import "../StakingStructs.sol";

interface ILockPositionContext {
    function initialize(address _admin, address _stakingContract) external;
    function createLockPositionContext(
        uint256 _amount, 
        uint256 _lockPeriod, 
        address _account) external returns (bytes32);
    function approveLockPositionContext(bytes32 _requestHash) external;
    function getAndExecuteLockPositionContext(bytes32 _requestHash) external returns (CreateLockParams memory);
    function getLockPositionContextsByAccount(address account) external view returns(CreateLockParams[] memory);
    function getLockPositionContextHashByAccountIndex(address account, uint256 index) external view returns(bytes32);
}
