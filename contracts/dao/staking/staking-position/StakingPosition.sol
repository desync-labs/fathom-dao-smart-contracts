// SPDX-License-Identifier: AGPL 3.0
// Copyright Fathom 2022
pragma solidity 0.8.16;
import "../../../common/SafeERC20.sol";
import "../../../common/security/AdminPausable.sol";
import "./interfaces/IStakingPosition.sol";
import "../interfaces/IStaking.sol";
import "../StakingStructs.sol";
contract StakingPosition is AdminPausable, IStakingPosition {
    using SafeERC20 for IERC20;
    struct StakingPositionStream {
        address owner;
        address manager;
        address rewardToken; 
    }

    
    address public stakingContract;
    address public mainToken;
    uint256 public maxLockPeriod;

    mapping(uint256 => Stream) public streams; 
    uint256 constant public MAIN_STREAM_ID = 0;
    uint32 internal constant ONE_YEAR = 31536000;

    
    function initialize(
        address _admin,
        address _stakingContract,
        address _mainToken
    ) external override initializer{
        pausableInit(0, _admin);
        stakingContract = _stakingContract;
        mainToken = _mainToken;
        streams[MAIN_STREAM_ID].owner = _admin;
        streams[MAIN_STREAM_ID].manager = _admin;
        streams[MAIN_STREAM_ID].rewardToken = _mainToken;
        maxLockPeriod = ONE_YEAR;
    }


    function createStream(
        uint256 streamId,
        address owner,
        address manager,
        address rewardToken
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        require(streams[streamId].rewardToken == address(0), "Stream already created");
        streams[streamId].owner = owner;
        streams[streamId].manager = manager;
        streams[streamId].rewardToken = rewardToken;
    }

    function updateStream(
        uint256 streamId,
        address owner,
        address manager,
        address rewardToken
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        require(streams[streamId].rewardToken != address(0), "Stream not created");
        streams[streamId].owner = owner;
        streams[streamId].manager = manager;
        streams[streamId].rewardToken = rewardToken;
    }

    function createLock(uint256 amount) external override onlyRole(DEFAULT_ADMIN_ROLE){
        IERC20(mainToken).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(mainToken).safeApprove(stakingContract, 0);
        IERC20(mainToken).safeApprove(stakingContract, amount);
        IStaking(stakingContract).createLock(amount, maxLockPeriod);
    }

    function claimAllStreamRewardsForLock(uint256 lockId) external override pausable(1) onlyRole(DEFAULT_ADMIN_ROLE){
        LockedBalance[] memory locks = IStaking(stakingContract).getAllLocks(address(this));
        require(locks[lockId - 1].end > block.timestamp, "Lock not yet opened for claim");
        IStaking(stakingContract).claimAllStreamRewardsForLock(lockId);
    }

    function claimAllStreamRewardsForAllLocksNotExpired() external override pausable(1) onlyRole(DEFAULT_ADMIN_ROLE){
        LockedBalance[] memory locks = IStaking(stakingContract).getAllLocks(address(this));
        for (uint256 lockId = 1; lockId <= locks.length; lockId++) {
            if (locks[lockId - 1].end > block.timestamp) {
                IStaking(stakingContract).claimAllStreamRewardsForLock(lockId);
            }
        }
    }

    function withdrawStream(uint256 streamId) external override pausable(1) {
        IStaking(stakingContract).withdrawStream(streamId);

    }
    function withdrawMainStream() external override pausable(1) {
        IStaking(stakingContract).withdrawStream(MAIN_STREAM_ID);
        uint256 balance = IERC20(mainToken).balanceOf(address(this));
        IERC20(mainToken).safeTransfer(msg.sender, balance);
       // uint256 newBalance = IERC20(mainToken).balanceOf(address(this));
    }
}