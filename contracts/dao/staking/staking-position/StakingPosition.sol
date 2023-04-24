// SPDX-License-Identifier: AGPL 3.0
// Copyright Fathom 2022
pragma solidity 0.8.16;
import "../../../common/SafeERC20.sol";
import "../../../common/security/AdminPausable.sol";
import "./interfaces/IStakingPosition.sol";
import "./interfaces/IStakingPositionFactory.sol";
import "../interfaces/IStaking.sol";
import "../StakingStructs.sol";
// solhint-disable not-rely-on-time
contract StakingPosition is AdminPausable, IStakingPosition {
    using SafeERC20 for IERC20;
    
    
    struct LockPositionData {
        uint256 amount;
        uint256 expiryTime;
    }

    address public stakingContract;
    address public mainToken;
    uint256 public maxLockPeriod;
    address public stakingFactory;

    

    LockPositionData[] public lockPositionData;
    
    uint32 internal constant ONE_YEAR = 31536000;
    uint256 constant public MAIN_STREAM_ID = 0;

    function initialize(
        address _admin,
        address _stakingContract,
        address _mainToken,
        address _stakingFactory
    ) external override initializer{
        pausableInit(0, _admin);
        stakingContract = _stakingContract;
        mainToken = _mainToken;
        stakingFactory = _stakingFactory;
        maxLockPeriod = ONE_YEAR;
    }


    function createLock(uint256 amount, uint256 end) external override onlyRole(DEFAULT_ADMIN_ROLE){
        IERC20(mainToken).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(mainToken).safeApprove(stakingContract, 0);
        IERC20(mainToken).safeApprove(stakingContract, amount);
        uint256 effectiveEnd = end > maxLockPeriod ? maxLockPeriod : end;
        lockPositionData.push(LockPositionData(amount, effectiveEnd));
        IStaking(stakingContract).createLock(amount, effectiveEnd);
    }

    function unlock(uint256 lockId) external override onlyRole(DEFAULT_ADMIN_ROLE){
        require(lockPositionData[lockId - 1].expiryTime > block.timestamp, "Lock Not Yet Opened for Unlock");
        _removeLockPosition(lockId);
        IStaking(stakingContract).unlock(lockId);
    }

    function claimAllStreamRewardsForLock(uint256 lockId) external override pausable(1) onlyRole(DEFAULT_ADMIN_ROLE){
        require(lockPositionData[lockId - 1].expiryTime > block.timestamp, "Lock Not Yet Opened for Unlock");
        IStaking(stakingContract).claimAllStreamRewardsForLock(lockId);
    }
    
    function withdrawStream(uint256 streamId) external override pausable(1) {
        address rewardToken = IStakingPositionFactory(stakingFactory).streamRewardToken(streamId);
        IStaking(stakingContract).withdrawStream(streamId);
        uint256 balance = IERC20(rewardToken).balanceOf(address(this));
        IERC20(rewardToken).safeTransfer(msg.sender, balance);
        require(IERC20(rewardToken).balanceOf(address(this)) == 0, "bad withdraw");
    }

    function withdrawMainStream() external override pausable(1) {
        IStaking(stakingContract).withdrawStream(MAIN_STREAM_ID);
        uint256 balance = IERC20(mainToken).balanceOf(address(this));
        IERC20(mainToken).safeTransfer(msg.sender, balance);
        require(IERC20(mainToken).balanceOf(address(this)) == 0, "bad withdraw");
    }

    function _removeLockPosition(uint256 lockId) internal {
        uint256 lastLockId = lockPositionData.length;
        if (lastLockId != lockId && lastLockId > 1) {
            lockPositionData[lockId - 1] = lockPositionData[lastLockId - 1];
        }
        lockPositionData.pop();
    }
}