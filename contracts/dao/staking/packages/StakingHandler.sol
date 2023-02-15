// SPDX-License-Identifier: AGPL 3.0
// Original Copyright Aurora
// Copyright Fathom 2022

pragma solidity 0.8.16;

import "./StakingInternals.sol";
import "../StakingStorage.sol";
import "../interfaces/IStakingHandler.sol";
import "../vault/interfaces/IVault.sol";
import "../../../common/security/AdminPausable.sol";
import "../../../common/SafeERC20Staking.sol";
// solhint-disable not-rely-on-time
contract StakingHandlers is StakingStorage, IStakingHandler, StakingInternals, AdminPausable {
    using SafeERC20Staking for IERC20;
    bytes32 public constant STREAM_MANAGER_ROLE = keccak256("STREAM_MANAGER_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    
    error NotPaused();
    error VaultNotSupported(address _vault);
    error VaultNotMigrated(address _vault);
    error ZeroLockId();
    error MaxLockPeriodExceeded();
    error MaxLockIdExceeded(uint256 _lockId, address _account);
    error ZeroPenalty();
    error AlreadyInitialized();
    error StreamIdZero();
    constructor() {
        _disableInitializers();
    }
    /**
     * @dev initialize the contract and deploys the first stream of rewards
     * @dev initializable only once due to stakingInitialised flag
     * @notice By calling this function, the deployer of this contract must
     * make sure that the Rewards amount was deposited to the treasury contract
     * before initializing of the default Stream
     * @param _vault The Vault address to store main token and rewards tokens
     * @param _mainToken token contract address
     * @param _weight Weighting coefficient for shares and penalties
     * @param _admin the owner and manager of the main token stream
     */
    function initializeStaking(
        address _admin,
        address _vault,
        address _mainToken,
        address _voteToken,
        Weight calldata _weight,
        VoteCoefficient calldata voteCoef,
        uint256 _maxLocks,
        address _rewardsContract,
        uint256 _minLockPeriod
    ) external override initializer {
        rewardsCalculator = _rewardsContract;
        _initializeStaking(_mainToken, _voteToken, _weight, _vault, _maxLocks, voteCoef.voteShareCoef, voteCoef.voteLockCoef);
        require(IVault(vault).isSupportedToken(_mainToken), "!token");
        pausableInit(1, _admin);
        _grantRole(STREAM_MANAGER_ROLE, _admin);
        _grantRole(TREASURY_ROLE, _admin);
        maxLockPeriod = ONE_YEAR;
        minLockPeriod = _minLockPeriod;
    }

    function initializeMainStream(
        address _owner,
        uint256[] memory scheduleTimes,
        uint256[] memory scheduleRewards,
        uint256 tau
    ) external override onlyRole(DEFAULT_ADMIN_ROLE){
        if(mainStreamInitialized == true){
            revert AlreadyInitialized();
        }
        IERC20(mainToken).safeTransferFrom(msg.sender,address(this),scheduleRewards[0]);
        _validateStreamParameters(_owner, mainToken, scheduleRewards[MAIN_STREAM], scheduleRewards[MAIN_STREAM], scheduleTimes, scheduleRewards, tau);
        uint256 streamId = 0;
        Schedule memory schedule = Schedule(scheduleTimes, scheduleRewards);
        streams.push(
            Stream({
                owner: _owner,
                manager: _owner,
                rewardToken: mainToken,
                maxDepositAmount: 0,
                minDepositAmount: 0,
                rewardDepositAmount: scheduleRewards[0],
                rewardClaimedAmount: 0,
                schedule: schedule,
                status: StreamStatus.ACTIVE,
                tau: tau,
                rps: 0
            })
        );
        _adminPause(0);
        mainStreamInitialized =true;
        _transfer(scheduleRewards[0],mainToken);
        emit StreamProposed(streamId, _owner, mainToken, scheduleRewards[MAIN_STREAM]);
        emit StreamCreated(streamId, _owner, mainToken, tau);
    }

    /**
     * @dev An admin of the staking contract can whitelist (propose) a stream.
     * Whitelisting of the stream provides the option for the stream
     * owner (presumably the issuing party of a specific token) to
     * deposit some ERC-20 tokens on the staking contract and potentially
     * get in return some main tokens immediately. 
     * @notice Manager of Vault must call
     * @param streamOwner only this account will be able to launch a stream
     * @param rewardToken the address of the ERC-20 tokens to be deposited in the stream
     * @param maxDepositAmount The upper amount of the tokens that should be deposited by stream owner
     * @param scheduleTimes timestamp denoting the start of each scheduled interval.
                            Last element is the end of the stream.
     * @param scheduleRewards remaining rewards to be delivered at the beginning of each scheduled interval. 
                               Last element is always zero.
     * First value (in scheduleRewards) from array is supposed to be a total amount of rewards for stream.
     * @param tau the tau is (pending release period) for this stream (e.g one day)
    */
    function proposeStream(
        address streamOwner,
        address rewardToken,
        uint256 maxDepositAmount,
        uint256 minDepositAmount,
        uint256[] memory scheduleTimes,
        uint256[] memory scheduleRewards,
        uint256 tau
    ) public override onlyRole(STREAM_MANAGER_ROLE) {
        _validateStreamParameters(streamOwner, rewardToken, maxDepositAmount, minDepositAmount, scheduleTimes, scheduleRewards, tau);
        require(IVault(vault).isSupportedToken(rewardToken), "!Token");
        Schedule memory schedule = Schedule(scheduleTimes, scheduleRewards);
        uint256 streamId = streams.length;
        streams.push(
            Stream({
                owner: streamOwner,
                manager: msg.sender,
                rewardToken: rewardToken,
                maxDepositAmount: maxDepositAmount,
                minDepositAmount: minDepositAmount,
                rewardDepositAmount: 0,
                rewardClaimedAmount: 0,
                schedule: schedule,
                status: StreamStatus.PROPOSED,
                tau: tau,
                rps: 0
            })
        );
        emit StreamProposed(streamId, streamOwner, rewardToken, maxDepositAmount);
    }

    function createStream(uint256 streamId, uint256 rewardTokenAmount) public override pausable(1){
        Stream storage stream = streams[streamId];
        require(stream.status == StreamStatus.PROPOSED, "nt proposed");
        require(stream.schedule.time[0] >= block.timestamp, "prop expire");
        require(stream.owner == msg.sender, "bad owner");

        require(rewardTokenAmount <= stream.maxDepositAmount, "rwrds high");
        require(rewardTokenAmount >= stream.minDepositAmount, "rwrds low");
        IERC20(stream.rewardToken).safeTransferFrom(msg.sender,address(this), rewardTokenAmount);

        stream.status = StreamStatus.ACTIVE;

        stream.rewardDepositAmount = rewardTokenAmount;
        if (rewardTokenAmount < stream.maxDepositAmount) {
            _updateStreamsRewardsSchedules(streamId, rewardTokenAmount);
        }
        require(stream.schedule.reward[0] == stream.rewardDepositAmount, "bad start");

        emit StreamCreated(streamId, stream.owner, stream.rewardToken,stream.tau);
        _transfer(rewardTokenAmount,stream.rewardToken);
    }

    function cancelStreamProposal(uint256 streamId) public override onlyRole(STREAM_MANAGER_ROLE) {
        Stream storage stream = streams[streamId];
        require(stream.status == StreamStatus.PROPOSED, "nt proposed");
        stream.status = StreamStatus.INACTIVE;

        emit StreamProposalCancelled(streamId, stream.owner, stream.rewardToken);
    }

    function removeStream(uint256 streamId, address streamFundReceiver) public override onlyRole(STREAM_MANAGER_ROLE) {
        if(streamId == 0){
            revert StreamIdZero();
        }
        require(streamTotalUserPendings[streamId] == 0, "nt withdrawn");
        Stream storage stream = streams[streamId];
        require(stream.status == StreamStatus.ACTIVE, "No Stream");
        stream.status = StreamStatus.INACTIVE;
        uint256 releaseRewardAmount = stream.rewardDepositAmount - stream.rewardClaimedAmount;
        uint256 rewardTreasury = IERC20(stream.rewardToken).balanceOf(vault);

        IVault(vault).payRewards(
            streamFundReceiver,
            stream.rewardToken,
            releaseRewardAmount <= rewardTreasury ? releaseRewardAmount : rewardTreasury // should not happen
        );
        emit StreamRemoved(streamId, stream.owner, stream.rewardToken);
    }

    function createLocksForCouncils(CreateLockParams[] calldata lockParams) public override onlyRole(DEFAULT_ADMIN_ROLE) {
        if(councilsInitialized == true){
            revert AlreadyInitialized();
        }
        councilsInitialized = true;
        for (uint256 i; i < lockParams.length; i++) {
            address account = lockParams[i].account;
            prohibitedEarlyWithdraw[account][locks[account].length + 1] = true;
            _createLock(lockParams[i].amount, lockParams[i].lockPeriod, account);
        }
    }
    
    function createLock(uint256 amount, uint256 lockPeriod) public override pausable(1) {
        _createLock(amount, lockPeriod, msg.sender);
    }

    function createLockWithoutEarlyWithdrawal(uint256 amount, uint256 lockPeriod) public override pausable(1){
        prohibitedEarlyWithdraw[msg.sender][locks[msg.sender].length + 1] = true;
        _createLock(amount, lockPeriod, msg.sender);
    }

    function unlock(uint256 lockId) public override pausable(1) {
        _verifyUnlock(lockId);
        LockedBalance storage lock = locks[msg.sender][lockId - 1];
        require(lock.end <= block.timestamp, "lock close");
        _updateStreamRPS();
        uint256 stakeValue = lock.amountOfToken;
        prohibitedEarlyWithdraw[msg.sender][lockId] = false;
        _unlock(stakeValue, stakeValue, lockId, msg.sender);
        
    }

    function unlockPartially(uint256 lockId, uint256 amount) public override pausable(1) {
        _verifyUnlock(lockId);
        LockedBalance storage lock = locks[msg.sender][lockId - 1];
        require(lock.end <= block.timestamp, "lock close");
        _updateStreamRPS();
        uint256 stakeValue = lock.amountOfToken;
        prohibitedEarlyWithdraw[msg.sender][lockId] = false;
        _unlock(stakeValue, amount, lockId, msg.sender);
    }

    function earlyUnlock(uint256 lockId) public override pausable(1) {
        _verifyUnlock(lockId);
        require(prohibitedEarlyWithdraw[msg.sender][lockId] == false, "early infeasible");
        LockedBalance storage lock = locks[msg.sender][lockId - 1];
        require(lock.end > block.timestamp, "lock open");
        _updateStreamRPS();
        _earlyUnlock(lockId, msg.sender);
    }

    function claimAllStreamRewardsForLock(uint256 lockId) public override pausable(1) {
        if(lockId > locks[msg.sender].length){
            revert MaxLockIdExceeded(lockId, msg.sender);
        }
        if(lockId == 0){
            revert ZeroLockId();
        }
        _updateStreamRPS();
        // Claim all streams while skipping inactive streams.
        _moveAllStreamRewardsToPending(msg.sender, lockId);
    }

    function claimAllLockRewardsForStream(uint256 streamId) public override pausable(1) {
        _updateStreamRPS();
        _moveAllLockPositionRewardsToPending(msg.sender, streamId);
    }

    function withdrawStream(uint256 streamId) public override pausable(1) {
        User storage userAccount = users[msg.sender];
        require(userAccount.pendings[streamId] != 0, "no pendings");
        require(block.timestamp > userAccount.releaseTime[streamId], "not released");
        require(streams[streamId].status == StreamStatus.ACTIVE, "stream inactive");
        _withdraw(streamId);
    }
    

    function withdrawAllStreams() public override pausable(1) {
        User storage userAccount = users[msg.sender];
        for (uint256 i; i < streams.length; i++) {
            if (userAccount.pendings[i] != 0 && block.timestamp > userAccount.releaseTime[i] && streams[i].status == StreamStatus.ACTIVE) {
                _withdraw(i);
            }
        }
    }
    /**
     * @dev Disregard rewards for emergency unlock and withdraw
     */
    function emergencyUnlockAndWithdraw() public override {
        if(paused == 0){
            revert NotPaused();
        }
        uint256 numberOfLocks = locks[msg.sender].length;
        for (uint256 lockId = numberOfLocks; lockId >= 1; lockId--) {
            uint256 stakeValue = locks[msg.sender][lockId - 1].amountOfToken;
            _unlock(stakeValue, stakeValue, lockId, msg.sender);
        }
        _withdraw(MAIN_STREAM);
    }

    function updateVault(address _vault) public override onlyRole(DEFAULT_ADMIN_ROLE) {
        // enforce pausing this contract before updating the address.
        // This mitigates the risk of future invalid reward claims
        if (paused == 0){
            revert NotPaused();
        }
        if(_vault == address(0)){
            revert ZeroAddress();
        }
        if(!IERC165Upgradeable(_vault).supportsInterface(type(IVault).interfaceId)){
            revert VaultNotSupported(_vault);
        }
        if(!IVault(vault).migrated()){
            revert VaultNotMigrated(vault);
        }
        vault = _vault;
    }

    function withdrawPenalty(address penaltyReceiver) public override pausable(1) onlyRole(TREASURY_ROLE) {
        if(totalPenaltyBalance == 0){
            revert ZeroPenalty();
        }
        _withdrawPenalty(penaltyReceiver);
    }

    function _createLock(
        uint256 amount,
        uint256 lockPeriod,
        address account
    ) internal{
        require(lockPeriod >= minLockPeriod, "min lock");
        require(locks[account].length <= maxLockPositions, "max locks");
        require(amount > 0, "amount 0");
        require(lockPeriod <= maxLockPeriod, "max time");
        IERC20(mainToken).safeTransferFrom(msg.sender,address(this),amount);
        _updateStreamRPS();
        _lock(account, amount, lockPeriod);
        _transfer(amount,mainToken);
    }

    function _verifyUnlock(uint256 lockId) internal view {
        if(lockId == 0){
            revert ZeroLockId();
        }
        if(lockId > locks[msg.sender].length){
            revert MaxLockIdExceeded(lockId, msg.sender);
        }
        LockedBalance storage lock = locks[msg.sender][lockId - 1];
        require(lock.owner == msg.sender, "bad owner");
        if(lock.amountOfToken == 0){
            revert ZeroLocked(lockId);
        }
    }

    function _transfer(uint256 _amount, address _token) internal{
        IERC20(_token).safeApprove(vault,0);
        IERC20(_token).safeApprove(vault,_amount);
        IVault(vault).deposit(_token, _amount);
    }

    function setMinimumLockPeriod(uint256 _minLockPeriod) public onlyRole(DEFAULT_ADMIN_ROLE){
        if(_minLockPeriod > maxLockPeriod){
            revert MaxLockPeriodExceeded();
        }
        minLockPeriod = _minLockPeriod;
    }
}
