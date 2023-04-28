// SPDX-License-Identifier: AGPL 3.0
// Copyright Fathom 2022
pragma solidity 0.8.16;
import "../../../common/SafeERC20.sol";
import "../../../common/security/AdminPausable.sol";
import "./interfaces/IStakingPosition.sol";
import "./interfaces/IStakingPositionFactory.sol";
import "./interfaces/IStakingContractRetriever.sol";

import "../interfaces/IStaking.sol";
import "../../governance/extensions/IVotes.sol";
// solhint-disable not-rely-on-time
contract StakingPosition is AdminPausable, IStakingPosition {
    using SafeERC20 for IERC20;
    
    struct LockPositionData {
        uint256 amount;
        uint256 expiryTime;
    }

    address public mainToken;
    address public stakingFactory;
    address public userAccount;

    LockPositionData[] public lockPositionData;
    
    uint32 internal constant ONE_YEAR = 31536000;
    uint256 constant public MAIN_STREAM_ID = 0;
    uint256 internal constant MAX_LOCK_PERIOD = 5 * ONE_YEAR;

    modifier onlyUser() {
        require(msg.sender == userAccount, "Only user can call this function");
        _;
    }

    modifier onlyAdminOrUser() {
        require(msg.sender == userAccount || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), 
                        "Only user or admin can call this function");
        _;
    }

    
    function initialize(
        address _admin,
        address _mainToken,
        address _stakingFactory,
        address _userAccount
    ) external override initializer{
        require(Address.isContract(_mainToken), "bad main token contract");
        require(Address.isContract(_stakingFactory), "bad staking factory contract");
        require(_admin != address(0), "bad owner");
        require(_userAccount != address(0), "bad user account");
        pausableInit(0, _admin);
        mainToken = _mainToken;
        stakingFactory = _stakingFactory;
        userAccount = _userAccount;
    }
    
    function createLock(uint256 amount, uint256 periodToLock) external override onlyAdminOrUser{
        require(periodToLock <= MAX_LOCK_PERIOD, "exceeds max lock period");
        IERC20(mainToken).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(mainToken).safeApprove(stakingContract(), 0);
        IERC20(mainToken).safeApprove(stakingContract(), amount);
        //Lock Position in the context of this contract
        //block.timestamp is added in this context as it is added while creating lock in actual staking contract
        uint256 expiryTime = block.timestamp + periodToLock;
        lockPositionData.push(LockPositionData(amount, expiryTime));
        uint256 maxLockPeriodInStaking = maxLockPeriod();
        uint256 effectivePeriod =
             periodToLock > maxLockPeriodInStaking ? maxLockPeriodInStaking : periodToLock;

        IStaking(stakingContract()).createLock(amount, effectivePeriod);
        IVotes(voteToken()).delegate(userAccount);
    }

    function unlock(uint256 lockId) external override onlyUser{
        require(lockId > 0, "LockId should be greater than 0");
        require(lockPositionData[lockId - 1].expiryTime <= block.timestamp, "Staking Position: Locking period has not expired yet");
        _removeLockPosition(lockId);
        IStaking(stakingContract()).claimAllStreamRewardsForLock(lockId);
        IStaking(stakingContract()).unlock(lockId);
    }

    function claimAllStreamRewardsForLock(uint256 lockId) external override onlyUser{
        require(lockId > 0, "LockId should be greater than 0");
        require(lockPositionData[lockId - 1].expiryTime <= block.timestamp, "Staking Position: Locking period has not expired yet");
        IStaking(stakingContract()).claimAllStreamRewardsForLock(lockId);
    }
    
    function withdrawStream(uint256 streamId) external override onlyUser{
        address rewardToken = IStakingPositionFactory(stakingFactory).streamRewardToken(streamId);
        require(rewardToken != address(0),"Stream Non existent or not udpated in factory");
        IStaking(stakingContract()).withdrawStream(streamId);
        uint256 balance = IERC20(rewardToken).balanceOf(address(this));
        IERC20(rewardToken).safeTransfer(msg.sender, balance);
        require(IERC20(rewardToken).balanceOf(address(this)) == 0, "Bad Withdraw");
    }

    function withdrawMainStream() external override pausable(1) onlyUser{
        IStaking(stakingContract()).withdrawStream(MAIN_STREAM_ID);
        uint256 balance = IERC20(mainToken).balanceOf(address(this));
        IERC20(mainToken).safeTransfer(msg.sender, balance);
        require(IERC20(mainToken).balanceOf(address(this)) == 0, "Bad Withdraw");
    }

    function emergencyUnlockAndWithdraw() external override onlyUser{
        require(IStakingContractRetriever(stakingContract()).paused() != 0, "Staking contract not paused to do emergency unlock and withdraw");
        IStakingHandler(stakingContract()).emergencyUnlockAndWithdraw();
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

    function maxLockPeriod() internal view returns (uint256){
        return IStakingContractRetriever(stakingContract()).maxLockPeriod();
    }

    function stakingContract() internal view returns (address) {
        return IStakingPositionFactory(stakingFactory).stakingContract();
    }
    function voteToken() internal view returns (address) {
        return IStakingContractRetriever(stakingContract()).voteToken();
    }
}