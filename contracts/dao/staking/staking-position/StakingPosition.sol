// SPDX-License-Identifier: AGPL 3.0
// Copyright Fathom 2022
pragma solidity 0.8.16;
import "../../../common/SafeERC20.sol";

import "./interfaces/IStakingPosition.sol";
import "./interfaces/IStakingPositionFactory.sol";
import "./interfaces/IStakingContractRetriever.sol";
import "../../../common/access/AccessControl.sol";

import "../interfaces/IStaking.sol";
import "../../governance/extensions/IVotes.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// solhint-disable not-rely-on-time
contract StakingPosition is AccessControl, ReentrancyGuard, IStakingPosition {
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
    uint256 internal constant MAIN_STREAM_ID = 0;
    uint256 internal constant MAX_LOCK_PERIOD = 5 * ONE_YEAR;

    event LogCreateLock(
        address indexed account,
        uint256 indexed lockId,
        uint256 amount,
        uint256 expiryTime
    );

    event LogUnlock(
        address indexed account,
        uint256 indexed lockId,
        uint256 amount
    );

    event LogWithdraw(
        address indexed account,
        uint256 indexed streamid,
        uint256 amount
    );

    event LogClaimAllReward(
        address indexed account,
        uint256 indexed lockId
    );

    event LogEmergencyUnlockAndWithdraw(
        address indexed account,
        uint256 amount
    );

    
    modifier onlyUser() {
        require(msg.sender == userAccount, "Only user can call this function");
        _;
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), 
                        "Only admin can call this");
        _;
    }

    
    constructor(
        address _admin,
        address _mainToken,
        address _stakingFactory,
        address _userAccount
    ) {
        require(Address.isContract(_mainToken), "bad main token contract");
        require(Address.isContract(_stakingFactory), "bad staking factory contract");
        require(_admin != address(0), "bad owner");
        require(_userAccount != address(0), "bad user account");
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        mainToken = _mainToken;
        stakingFactory = _stakingFactory;
        userAccount = _userAccount;
    }
    
    function createLock(uint256 amount, uint256 periodToLock) external override onlyAdmin nonReentrant{
        require(periodToLock <= MAX_LOCK_PERIOD, "exceeds max lock period");
        require(amount > 0, "Amount should be greater than 0");
        require(periodToLock >= IStakingContractRetriever(stakingContract()).minLockPeriod(),
            "Period to lock should be greater than min lock period");
        
        uint256 balanceBeforeRetrieivingTokens = IERC20(mainToken).balanceOf(address(this));
        IERC20(mainToken).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(mainToken).safeApprove(stakingContract(), 0);
        IERC20(mainToken).safeApprove(stakingContract(), amount);
        uint256 balanceAfterRetrievingTokens = IERC20(mainToken).balanceOf(address(this));
        require(balanceAfterRetrievingTokens - balanceBeforeRetrieivingTokens == amount, "Main Token Amount not retrieved");
        
        //Lock Position in the context of this contract
        //block.timestamp is added in this context to have more locking period available
        uint256 expiryTime = block.timestamp + periodToLock;
        lockPositionData.push(LockPositionData(amount, expiryTime));
        
        uint256 maxLockPeriodInStaking = maxLockPeriod();
        uint256 effectivePeriod =
             periodToLock > maxLockPeriodInStaking ? maxLockPeriodInStaking : periodToLock;
        
        uint256 balanceBeforeCreatingLock = IERC20(mainToken).balanceOf(address(this));
        IStaking(stakingContract()).createLock(amount, effectivePeriod);
        uint256 balanceAfterCreatingLock = IERC20(mainToken).balanceOf(address(this));
        require(balanceBeforeCreatingLock - balanceAfterCreatingLock == amount,"Main Token Amount not locked");
        //delegate votes to the userAccount
        IVotes(voteToken()).delegate(userAccount);
        emit LogCreateLock(userAccount, lockPositionData.length, amount, expiryTime);
    }

    function unlock(uint256 lockId) external override onlyUser nonReentrant{
        _verifyUnlockOrClaim(lockId);
        LockPositionData memory lockPosition = lockPositionData[lockId - 1];
        _removeLockPosition(lockId);
        IStaking(stakingContract()).claimAllStreamRewardsForLock(lockId);
        IStaking(stakingContract()).unlock(lockId);
        emit LogUnlock(msg.sender, lockId, lockPosition.amount);
    }

    function claimAllStreamRewardsForLock(uint256 lockId) external override onlyUser nonReentrant{
        _verifyUnlockOrClaim(lockId);
        IStaking(stakingContract()).claimAllStreamRewardsForLock(lockId);
        emit LogClaimAllReward(msg.sender, lockId);
    }
    /**
     * @dev withdraws the stream reward from the staking contract
     * @notice can only withdraw after the cooldown period of the stream, enforced by the staking contract
     */
    function withdrawStream(uint256 streamId) external override onlyUser nonReentrant{
        address rewardToken = IStakingPositionFactory(stakingFactory).getStreamRewardToken(streamId);
        require(rewardToken != address(0),"Stream Non existent or not udpated in factory");
        IStaking(stakingContract()).withdrawStream(streamId);
        _withdrawToken(rewardToken, streamId);
    }

    /**
     * @dev withdraws the stream reward from the staking contract
     * @notice can only withdraw after the cooldown period of the stream, enforced by the staking contract
     */
    function withdrawMainStream() external override onlyUser nonReentrant{
        IStaking(stakingContract()).withdrawStream(MAIN_STREAM_ID);
        //balance of the contract after withdrawing from staking contract
        _withdrawToken(mainToken, MAIN_STREAM_ID);
    }

    function emergencyUnlockAndWithdraw() external override onlyUser nonReentrant{
        require(IStakingContractRetriever(stakingContract()).paused() != 0, "Staking contract not paused to do emergency unlock and withdraw");
        IStakingHandler(stakingContract()).emergencyUnlockAndWithdraw();
        _withdrawToken(mainToken, MAIN_STREAM_ID);
        emit LogEmergencyUnlockAndWithdraw(
            msg.sender,
            IERC20(mainToken).balanceOf(address(this))
        );
    }

    //getters:
    function getLockInfo(uint256 lockId) external view override returns (uint256, uint256){
        require(lockId > 0, "LockId should be greater than 0");
        require(lockId <= lockPositionData.length, "Exceeds total lock positions");
        return (lockPositionData[lockId - 1].amount, lockPositionData[lockId - 1].expiryTime);
    }

    function getMainStreamClaimableAmountPerLock(uint256 lockId) external view override returns (uint256) {
        require(lockId > 0, "LockId should be greater than 0");
        require(lockId <= lockPositionData.length, "Exceeds total lock positions");
        return IStaking(stakingContract()).getStreamClaimableAmountPerLock(MAIN_STREAM_ID, address(this), lockId);
    }

    function getStreamClaimableAmount(uint256 streamId, uint256 lockId) external view override returns (uint256) {
        require(lockId > 0, "LockId should be greater than 0");
        require(lockId <= lockPositionData.length, "Exceeds total lock positions");
        address rewardToken = IStakingPositionFactory(stakingFactory).getStreamRewardToken(streamId);
        require(rewardToken != address(0),"Stream Non existent or not udpated in factory");
        return IStaking(stakingContract()).getStreamClaimableAmountPerLock(streamId, address(this), lockId);
    }

    function totalLockPositions() external view override returns (uint256) {
        return lockPositionData.length;
    }

    //copying the logic from staking contract.
    function _removeLockPosition(uint256 lockId) internal {
        uint256 lastLockId = lockPositionData.length;
        if (lastLockId != lockId && lastLockId > 1) {
            lockPositionData[lockId - 1] = lockPositionData[lastLockId - 1];
        }
        lockPositionData.pop();
    }

    function _withdrawToken(address token, uint256 streamId) internal {
        //balance of the contract after withdrawing from staking contract
        uint256 balance = IERC20(token).balanceOf(address(this));
        uint256 balanceOfUserBeforeTransfer= IERC20(token).balanceOf(msg.sender);
        
        IERC20(token).safeTransfer(msg.sender, balance);
        uint256 balanceOfUserAfterTransfer = IERC20(token).balanceOf(msg.sender);
        //balance of use should be increaesd by the amount withdrawn
        //doing only greater than to compensate for token that deflationary token
        require(balanceOfUserAfterTransfer > balanceOfUserBeforeTransfer, "Withdraw incomplete");
        emit LogWithdraw(msg.sender, streamId, balance);
    }

    function _verifyUnlockOrClaim(uint256 lockId) internal view {
        require(lockId > 0, "LockId should be greater than 0");
        require(lockId <= lockPositionData.length, "Exceeds total lock positions");
        LockPositionData memory lockPosition = lockPositionData[lockId - 1];
        require(lockPosition.amount > 0, "Lock Position does not have amount");
        require(lockPosition.expiryTime > 0, "Lock Position does not have expiry time");
        require(lockPosition.expiryTime <= block.timestamp, 
            "Staking Position: Locking period has not expired yet");
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