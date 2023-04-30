// SPDX-License-Identifier: AGPL 3.0
// Copyright Fathom 2022
pragma solidity 0.8.16;
import "../../StakingStructs.sol";
interface IStakingPosition {
    function createLock(uint256 amount, uint256 end) external;
    function claimAllStreamRewardsForLock(uint256 lockId) external;
    function withdrawStream(uint256 streamId) external;
    function withdrawMainStream() external;
    function unlock(uint256 lockId) external;
    function emergencyUnlockAndWithdraw() external;
    function getLockInfo(uint256 lockId) external view returns (uint256, uint256);
    function getMainStreamClaimableAmountPerLock(uint256 lockId) external view returns (uint256);
    function getStreamClaimableAmount(uint256 streamId, uint256 lockId) external view returns (uint256);
    function totalLockPositions() external view returns (uint256);
}