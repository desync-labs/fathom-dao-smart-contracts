// SPDX-License-Identifier: AGPL 3.0
// Original Copyright Aurora
// Copyright Fathom 2022

pragma solidity 0.8.13;

import "./StakingInternals.sol";
import "../StakingStorage.sol";
import "../interfaces/IStakingHandler.sol";
import "../vault/interfaces/IVault.sol";
import "../../../common/security/ReentrancyGuard.sol";
import "../../../common/security/AdminPausable.sol";

// solhint-disable not-rely-on-time
contract StakingHandlers is
    StakingStorage,
    IStakingHandler,
    StakingInternals,
    ReentrancyGuard,
    AdminPausable
{
    bytes32 public constant STREAM_MANAGER_ROLE = keccak256("STREAM_MANAGER_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    /**
    * @dev initialize the contract and deploys the first stream of rewards(FTHM)
    * @dev initializable only once due to stakingInitialised flag
    * @notice By calling this function, the deployer of this contract must
    * make sure that the FTHM Rewards amount was deposited to the treasury contract
    * before initializing of the default FTHM Stream
    * @param _vault The Vault address to store FTHM and rewards tokens
    * @param _fthmToken token contract address
    * @param _weight Weighting coefficient for shares and penalties
    * @param streamOwner the owner and manager of the FTHM stream
    * @param scheduleTimes init schedules times
    * @param scheduleRewards init schedule rewards
    * @param tau release time constant per stream
    */
    function initializeStaking(
        address _vault,
        address _fthmToken,
        address _veFTHM,
        Weight calldata _weight,
        address streamOwner,
        uint256[] memory scheduleTimes,
        uint256[] memory scheduleRewards,
        uint256 tau,
        uint256 _voteShareCoef,
        uint256 _voteLockCoef,
        uint256 _maxLocks
    ) public override {
        require(!stakingInitialised, "intiailised");
        _validateStreamParameters(
            streamOwner,
            _fthmToken,
            scheduleRewards[0],
            scheduleRewards[0],
            scheduleTimes,
            scheduleRewards,
            tau
        );
        _initializeStaking(_fthmToken, _veFTHM, _weight, _vault, _maxLocks, _voteShareCoef,_voteLockCoef);
        require(IVault(vault).isSupportedToken(_fthmToken), "Unsupported token");
        pausableInit(0);
        _grantRole(STREAM_MANAGER_ROLE, msg.sender);
        _grantRole(TREASURY_ROLE, msg.sender);
        uint256 streamId = 0;
        Schedule memory schedule = Schedule(scheduleTimes, scheduleRewards);
        streams.push(
            Stream({
                owner: streamOwner,
                manager: streamOwner,
                rewardToken: fthmToken,
                maxDepositAmount: 0,
                minDepositAmount: 0,
                rewardDepositAmount: 0,
                rewardClaimedAmount: 0,
                schedule: schedule,
                status: StreamStatus.ACTIVE,
                tau: tau,
                rps: 0
            })
        );
        maxLockPeriod = ONE_YEAR;
        stakingInitialised = true;
        emit StreamProposed(streamId, streamOwner, fthmToken, scheduleRewards[0]);
        emit StreamCreated(streamId, streamOwner, fthmToken, scheduleRewards[0]);
    }
    /**
     * @dev An admin of the staking contract can whitelist (propose) a stream.
     * Whitelisting of the stream provides the option for the stream
     * owner (presumably the issuing party of a specific token) to
     * deposit some ERC-20 tokens on the staking contract and potentially
     * get in return some FTHM tokens immediately. 
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
        _validateStreamParameters(
            streamOwner,
            rewardToken,
            maxDepositAmount,
            minDepositAmount,
            scheduleTimes,
            scheduleRewards,
            tau
        );
        // check FTHM token address is supportedToken in the treasury
        require(IVault(vault).isSupportedToken(rewardToken), "Unsupport Token");
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

    /**
     * @dev create new stream (only stream owner)
     * stream owner must approve reward tokens to this contract.
     * @param streamId stream id
     */
    function createStream(uint256 streamId, uint256 rewardTokenAmount) public override pausable(1) {
        Stream storage stream = streams[streamId];
        require(stream.status == StreamStatus.PROPOSED, "nt proposed");
        require(stream.schedule.time[0] >= block.timestamp, "prop expire");

        require(rewardTokenAmount <= stream.maxDepositAmount, "rwrds high");
        require(rewardTokenAmount >= stream.minDepositAmount, "rwrds low");

        stream.status = StreamStatus.ACTIVE;

        stream.rewardDepositAmount = rewardTokenAmount;
        if (rewardTokenAmount < stream.maxDepositAmount) {
            _updateStreamsRewardsSchedules(streamId, rewardTokenAmount);
        }
        require(stream.schedule.reward[0] == stream.rewardDepositAmount, "bad start point");

        emit StreamCreated(streamId, stream.owner, stream.rewardToken, rewardTokenAmount);

        IERC20(stream.rewardToken).transferFrom(msg.sender, address(vault), rewardTokenAmount);
    }

    //STREAM_MANAGER_ROLE
    function cancelStreamProposal(uint256 streamId) public override onlyRole(STREAM_MANAGER_ROLE) {
        Stream storage stream = streams[streamId];
        require(stream.status == StreamStatus.PROPOSED, "nt proposed");
        // cancel pa proposal
        stream.status = StreamStatus.INACTIVE;

        emit StreamProposalCancelled(streamId, stream.owner, stream.rewardToken);
    }

    // STREAM_MANAGER_ROLE
    /// @dev removes a stream (only default admin role)
    /// @param streamId stream index
    function removeStream(uint256 streamId, address streamFundReceiver)
        public
        override
        onlyRole(STREAM_MANAGER_ROLE)
    {
        require(streamId != 0, "Stream 0");
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

    function createLockWithFlag(
        uint256 amount, 
        uint256 lockPeriod, 
        address account,
        bool flag) public override pausable(1) onlyRole(TREASURY_ROLE)
    {   
            noEarlyWithdrawl[account][locks[account].length + 1] = flag;
            createLock(amount, lockPeriod, account);
    } 

    /**
     * @dev Creates a new lock position with lock period of unlock time
     * @param amount the amount for a lock position
     * @param lockPeriod the locking period
     */
    function createLock(uint256 amount, uint256 lockPeriod, address account) public override nonReentrant pausable(1) {
        require(locks[msg.sender].length <= maxLockPositions, "max locks");
        require(amount > 0, "amount 0");
        require(lockPeriod <=  maxLockPeriod, "max lock period");
        _before();
        _lock(account, amount,lockPeriod);
        IERC20(fthmToken).transferFrom(account, address(vault), amount);
    }

    /**
     * @dev This function unlocks the whole position of the lock id.
     * @notice stakeValue is calcuated to balance the shares calculation
     * @param lockId The lockId to unlock completely
     */
    function unlock(uint256 lockId) public override nonReentrant pausable(1) {
        _isItUnlockable(lockId);
        LockedBalance storage lock = locks[msg.sender][lockId - 1];
        require(lock.end <= block.timestamp, "lock not open");
        _before();
        uint256 stakeValue = (totalAmountOfStakedFTHM * lock.FTHMShares) / totalFTHMShares;
        _unlock(stakeValue,stakeValue,lockId,msg.sender);
        _withdrawFTHM();
    }

    /**
     * @dev This funciton allows for earlier withdrawal but with penalty
     * @param lockId The lock id to unlock early
     */
    function earlyUnlock(uint256 lockId) public override nonReentrant pausable(1) {
        _isItUnlockable(lockId);
        require(noEarlyWithdrawl[msg.sender][lockId] == false,"early infeasible");
        LockedBalance storage lock = locks[msg.sender][lockId - 1];
        require(lock.end > block.timestamp, "lock opened");
        _before();
        _earlyUnlock(lockId, msg.sender);
        _withdrawFTHM();
    }

    /**a
     * @dev This function unstakes a portion of lock position
     * @notice stakeValue is calcuated to balance the shares calculation.
     * @param lockId The lock id to unlock partially
     * @param amount The amount to unlock partially
     */
    function unstakePartially(uint256 lockId, uint256 amount) override public nonReentrant{ 
        LockedBalance storage lock = locks[msg.sender][lockId - 1];
        _isItUnlockable(lockId);
        require(lock.end <= block.timestamp, "!lockopen");
        _before();
        uint256 stakeValue = (totalAmountOfStakedFTHM * lock.FTHMShares) / totalFTHMShares;
        _unlock(stakeValue,amount,lockId, msg.sender);
        _withdrawFTHM();
    }

    /**
     * @dev This function claims rewards of a stream for a lock position and adds to pending of user.
     * @param streamId The id of the stream to claim rewards from
     * @param lockId The position of lock to claim rewards
     */
    function claimRewards(uint256 streamId, uint256 lockId) public override pausable(1) {
        require(lockId <= locks[msg.sender].length, "bad lockid");
        _before();
        _moveRewardsToPending(msg.sender, streamId, lockId);
    }
    
     /**
     * @dev This function claims all the rewards for lock position and adds to pending of user.
     * @param lockId The position of lock to claim rewards
     */
    function claimAllStreamRewardsForLock(uint256 lockId) public override pausable(1) {
        require(lockId <= locks[msg.sender].length, "bad lockid");
        _before();
        // Claim all streams while skipping inactive streams.
        _moveAllStreamRewardsToPending(msg.sender, lockId);
    }

    function claimAllLockRewardsForStream(uint256 streamId) public override pausable(1) {
        _before();
        _moveAllLockPositionRewardsToPending(msg.sender, streamId);
    }
    /**
     * @dev withdraw amount in the pending pool. User should wait for
     * pending time (tau constant) in order to be able to withdraw.
     * @param streamId stream index
     */
    function withdraw(uint256 streamId) public override pausable(1) {
        require(block.timestamp > users[msg.sender].releaseTime[streamId], "not released");
        _withdraw(streamId);
    }

    /**
     * @dev withdraw all claimed balances which have passed pending periode.
     * This function will reach gas limit with too many streams,
     * so the frontend will allow individual stream withdrawals and disable withdrawAll.
     */
    function withdrawAll() public override pausable(1) {
        User storage userAccount = users[msg.sender];
        for (uint256 i = 0; i < streams.length; i++) {
            if (userAccount.pendings[i] != 0 && block.timestamp > userAccount.releaseTime[i]) {
                _withdraw(i);
            }
        }
    }

    function setWeight(Weight memory _weight) override public  {
        weight = _weight;
    }

    function withdrawPenalty(address penaltyReceiver) public override pausable(1) onlyRole(TREASURY_ROLE){
        require(totalPenaltyBalance > 0, "no penalty");
        _withdrawPenalty(penaltyReceiver);
    }
    function _withdrawFTHM() internal{
        //fthm stream id = 0
        _withdraw(0);
    }
    function _isItUnlockable(uint256 lockId) internal view  {
        require(lockId > 0,"zero lockid");
        require(lockId <= locks[msg.sender].length, "bad lockid");
        LockedBalance storage lock = locks[msg.sender][lockId - 1];
        require(lock.amountOfFTHM > 0, "no lock amount");
        require(lock.owner == msg.sender, "bad owner");
    }
}
