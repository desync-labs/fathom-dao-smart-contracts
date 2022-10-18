// SPDX-License-Identifier: AGPL 3.0
// Original Copyright Aurora
// Copyright Fathom 2022

pragma solidity ^0.8.13;
import "../StakingStorage.sol";
import "../../../dao/governance/token/ERC20/IERC20.sol";
import "../../governance/interfaces/IVeMainToken.sol";
import "./RewardsInternals.sol";
import "../interfaces/IStakingEvents.sol";
import "../vault/interfaces/IVault.sol";
import "../library/BoringMath.sol";
contract StakingInternals is StakingStorage, RewardsInternals {
    // solhint-disable not-rely-on-time
    
    /**
     * @dev internal function to initialize the staking contracts.
     */
    function _initializeStaking(
        address _fthmToken,
        address voteFTHM,
        Weight memory _weight,
        address _vault,
        uint256 _voteShareCoef,
        uint256 _voteLockWeight,
        uint256 _maxLockPositions
    ) internal {
        require(_fthmToken != address(0x00), "main addr zero");
        require(voteFTHM != address(0x00), "vote addr zero");
        require(_vault != address(0x00), "vaultAddr zero");

        require(_weight.maxWeightShares > _weight.minWeightShares, "invalid share wts");
        require(_weight.maxWeightPenalty > _weight.minWeightPenalty, "invalid penalty wts");
        fthmToken = _fthmToken;
        veFTHM = voteFTHM;
        weight = _weight;
        vault = _vault;
        voteShareCoef = _voteShareCoef;
        voteLockWeight = _voteLockWeight;
        maxLockPositions = _maxLockPositions;
    }

    /**
     * @dev Creates a new lock position for an account and stakes the position for rewards
     * @notice lockId is index + 1 of array of Locked Balance
     * @param account The address of the lock creator
     * @param _newLocked The LockedBalance with zero balances updated through this function
     * @param amount The amount to lock and stake
     */
    function _lock(
        address account,
        LockedBalance memory _newLocked,
        uint256 amount
    ) internal {
        //@notice: newLock.end is always greater than block.timestamp
        uint256 lockPeriod = _newLocked.end - block.timestamp;
        uint256 nVeFTHM = _updateGovnWeightLock(amount, lockPeriod, account);
        _newLocked.amountOfveFTHM += BoringMath.to128(nVeFTHM);
        if (amount > 0) {
            _newLocked.amountOfFTHM += BoringMath.to128(amount);
        }
        locks[account].push(_newLocked);
        //+1 index
        uint256 newLockId = locks[account].length;
        _stake(account, amount, nVeFTHM, newLockId);
        
        if (nVeFTHM > 0) {
            IVeMainToken(veFTHM).mint(account, nVeFTHM);
        }
    }

    /**
     * @dev Unlocks the lockId position and unstakes it from staking pool
     * @dev Updates Governance weights after unlocking
     * WARNING: rewards are not claimed during unlock.
       The UI must make sure to claim rewards before unstaking.
       Unclaimed rewards will be lost.
      `_before()` must be called before `_unlock` to update streams rps
     * @notice lockId is index + 1 of array of Locked Balance
     * @notice If the lock position is completely unlocked then the last lock is swapped with current locked
     * and last lock is popped off.
     * @param lockId the lock id of the locked position to unlock
     * @param account The address of owner of the lock
     */
    function _unlock(
        uint256 lockId,
        address account
    ) internal {

        User storage userAccount = users[account];
        LockedBalance storage updateLock = locks[account][lockId - 1];
        onlyValidSharesAmount(updateLock);
        uint256 stakeValue = (totalAmountOfStakedFTHM * updateLock.FTHMShares) / totalFTHMShares;

        uint256 nLockedVeFTHM = updateLock.amountOfveFTHM;
        
        _updateGovnWeightUnlock(updateLock, userAccount);
        _unstake(updateLock, stakeValue, lockId, account);

        /// @notice This is for dust mitigation, so that even if the
        //  user does not hae enough veFTHM, it is still able to burn and unlock
        //  takes a bit of gas
        uint256 balance = IERC20(veFTHM).balanceOf(account);
        if (balance < nLockedVeFTHM) {
            nLockedVeFTHM = balance;
        }
        IVeMainToken(veFTHM).burn(account, nLockedVeFTHM);
    }

    /**
     * @dev Stakes the whole lock position and calculates Stream Shares and Main Token Shares
            for the lock position to distribute rewards based on it
     * @notice autocompounding feature is implemented through amountOfMainTokenShares
     * @notice the amount of stream shares you receive decreases from 100% to 25%
     * @notice the amount of stream shares you receive depends upon when in the timeline you have staked
     * @param account The account for which the lock position is staked
     * @param amount The amount of lock position to stake
     * @param nVeFTHM The amount of vote tokens released
     * @param lockId The lock id of the lock position
     */ 
    function _stake(
        address account,
        uint256 amount,
        uint256 nVeFTHM,
        uint256 lockId
    ) internal {
        User storage userAccount = users[account];
        LockedBalance storage lock = locks[account][lockId - 1];

        uint256 amountOfFTHMShares = _caclulateAutoCompoundingShares(amount);

        totalAmountOfStakedFTHM += amount;
        totalFTHMShares += amountOfFTHMShares;

        uint256 weightedAmountOfSharesPerStream = _weightedShares(amountOfFTHMShares, nVeFTHM, block.timestamp);

        totalStreamShares += weightedAmountOfSharesPerStream;

        lock.positionStreamShares += BoringMath.to128(weightedAmountOfSharesPerStream);
        lock.FTHMShares += BoringMath.to128(amountOfFTHMShares);

        uint256 streamsLength = streams.length;
        for (uint256 i = 1; i < streamsLength; i++) {
            userAccount.rpsDuringLastClaimForLock[lockId][i] = streams[i].rps;
        }

        emit Staked(account, weightedAmountOfSharesPerStream, nVeFTHM, lockId);
    }

    /// WARNING: rewards are not claimed during unstake.
    /// The UI must make sure to claim rewards before unstaking.
    /// Unclaimed rewards will be lost.
    /// `_before()` must be called before `_unstake` to update streams rps
    /**
     * @dev Unstakes the amount that you want to unstake and reapplies the shares to remaining stake value
     * @param updateLock The storage reference to the lock which gets updated
     * @param stakeValue The total stake of the lock position
     * @param lockId The lock id of the lock position
     * @param account The account whose lock position is to be unstaked
     */
    function _unstake(
        LockedBalance storage updateLock,
        uint256 stakeValue,
        uint256 lockId,
        address account
    ) internal {
        User storage userAccount = users[account];

        totalAmountOfStakedFTHM -= stakeValue;
        totalStreamShares -=  updateLock.positionStreamShares;
        totalFTHMShares -= updateLock.FTHMShares;

        userAccount.pendings[0] += stakeValue;
        userAccount.releaseTime[0] = block.timestamp + streams[0].tau;
        emit Unstaked(account, stakeValue, lockId);

        _removeLockPosition(userAccount, account, lockId);
    }

    /**
     @dev Used to unlock a position early with penalty
     @dev This unlocks and unstakes the position completely and then applies penalty
     @notice The weighing function decreases based upon the remaining time left in the lock
     @notice The penalty is decreased from the pendings of FTHM stream
     @notice Early unlock completely unlocks your whole position and vote tokens
     @param lockId The lock id of lock position to early unlock
     @param account The account whose lock position is unlocked early
     */
    function _earlyUnlock(
        uint256 lockId,
        address account
    ) internal {
        LockedBalance storage lock = locks[account][lockId - 1];
        uint256 lockEnd = lock.end;
        uint256 amount = (totalAmountOfStakedFTHM * lock.FTHMShares) / totalFTHMShares;
        _unlock(lockId, account);

        uint256 weighingCoef = _weightedPenalty(lockEnd, block.timestamp);

        uint256 penalty = (weighingCoef * amount) / 100000;

        User storage userAccount = users[account];

        require(userAccount.pendings[0] >= penalty, "penalty high");
        userAccount.pendings[0] -= penalty;
        totalPenaltyBalance += penalty;
    }

    /**
     * @dev Updates the balance of Vote token of the user for locking
     * @notice Calculation of number of vote tokens is based upon amount locked and it's time period
     * @param amount The amount of Main Tokens for which vote tokens is to released
     * @param lockingPeriod The period for which the tokens are locked
     * @param account The account for which the tokens are locked
     */
    function _updateGovnWeightLock(
        uint256 amount,
        uint256 lockingPeriod,
        address account
    ) internal returns (uint256) {
        User storage userAccount = users[account];
        uint256 nVeFTHM = _calculateGovnToken(amount, lockingPeriod); //maxVoteTokens;
        userAccount.veFTHMBalance += BoringMath.to128(nVeFTHM);
        totalAmountOfveFTHM += nVeFTHM;

        return nVeFTHM;
    }

    /**
     * @dev Updates balances of vote tokens for Locks and user accounts during unlock
     * @notice completely sets the balance of vote tokens to zero for a lock
     * @notice sets remaining balance for the user account
     */
    function _updateGovnWeightUnlock(LockedBalance storage updateLock, User storage userAccount) internal {
        uint256 nVeFTHM = updateLock.amountOfveFTHM;
        ///@notice if you unstake, early or partial or complete,
        ///        the number of vote tokens for lock position is set to zero
        updateLock.amountOfveFTHM = 0;
        totalAmountOfveFTHM -= nVeFTHM;
        uint256 remainingvFTHMBalance = 0;

        //this check to not overflow:
        if (userAccount.veFTHMBalance > nVeFTHM) {
            remainingvFTHMBalance = userAccount.veFTHMBalance - nVeFTHM;
        }
        userAccount.veFTHMBalance = BoringMath.to128(remainingvFTHMBalance);
    }


    function _removeLockPosition(
        User storage userAccount,
        address account,
        uint256 lockId
    ) internal {
        uint256 streamsLength = streams.length;
        uint256 lastLockId = locks[account].length;
        if (lastLockId != lockId && lastLockId > 1) {
            LockedBalance storage lastIndexLockedBalance = locks[account][lastLockId - 1];
            locks[account][lockId - 1] = lastIndexLockedBalance;
            for (uint256 i = 1; i < streamsLength; i++) {
                userAccount.rpsDuringLastClaimForLock[lockId][i] = userAccount.rpsDuringLastClaimForLock[lastLockId][i];
            }
        }
        for (uint256 i = 1; i < streamsLength; i++) {
            delete userAccount.rpsDuringLastClaimForLock[lastLockId][i];
        }
        locks[account].pop();
    }

    /**
     * @dev withdraw stream rewards after the release time.
     * @param streamId the stream index
     */
    function _withdraw(uint256 streamId) internal {
        User storage userAccount = users[msg.sender];
        uint256 pendingAmount = userAccount.pendings[streamId];
        userAccount.pendings[streamId] = 0;
        emit Released(streamId, msg.sender, pendingAmount);
        IVault(vault).payRewards(msg.sender, streams[streamId].rewardToken, pendingAmount);
    }

    function _withdrawPenalty(address accountTo) internal {
        uint256 pendingPenalty = totalPenaltyBalance;
        totalPenaltyBalance = 0;
        totalPenaltyReleased += pendingPenalty;
        IVault(vault).payRewards(accountTo, fthmToken, pendingPenalty);
    }


    /**
     * @dev calculate the weighted stream shares at given timeshamp.
     * @param amountOfFTHMShares The amount of Shares a user has
     * @param nVeFTHM The amount of Vote token for which shares will be calculated
     * @param timestamp the timestamp refering to the current or older timestamp
     */
    function _weightedShares(
        uint256 amountOfFTHMShares,
        uint256 nVeFTHM,
        uint256 timestamp
    ) internal view returns (uint256) {
        ///@notice Shares accomodate vote the amount of  FTHMShares and vote Tokens to be released
        ///@notice This formula makes it so that both the time locked for Main token and the amount of token locked
        ///        is used to calculate rewards
        uint256 shares = amountOfFTHMShares + (voteShareCoef * nVeFTHM) / 1000;
        uint256 slopeStart = streams[0].schedule.time[0] + ONE_MONTH;
        uint256 slopeEnd = slopeStart + ONE_YEAR;
        if (timestamp <= slopeStart) return shares * weight.maxWeightShares;
        if (timestamp >= slopeEnd) return shares * weight.minWeightShares;
        return
            shares *
            weight.maxWeightShares +
            (shares * (weight.maxWeightShares - weight.minWeightShares) * (slopeEnd - timestamp)) /
            (slopeEnd - slopeStart);
    }

    /**
     * @dev calculate auto compounding shares
     * @notice totalAmountOfStakedFTHM => increases when Main tokens are rewarded.(_before())
     * @notice thus amount of shares for new user, decreases.
     * @notice creating compound affect for users already staking.
     */
    function _caclulateAutoCompoundingShares(uint256 amount) internal view returns (uint256) {
        uint256 _amountOfShares = 0;
        if (totalFTHMShares == 0) {
            _amountOfShares = amount;
        } else {
            uint256 numerator = amount * totalFTHMShares;
            _amountOfShares = numerator / totalAmountOfStakedFTHM;
            if (_amountOfShares * totalAmountOfStakedFTHM < numerator) {
                _amountOfShares += 1;
            }
        }

        return _amountOfShares;
    }

    /**
     * @dev Calculates the penalty for early withdrawal
     * @notice The penalty decreases linearly over time
     * @notice The penalty depends upon the remaining time for opening of lock
     * @param lockEnd The timestamp when the lock will open
     * @param timestamp The current timestamp to calculate the remaining time
     */
    function _weightedPenalty(uint256 lockEnd, uint256 timestamp) internal view returns (uint256) {
        uint256 slopeStart = lockEnd;
        uint256 remainingTime = slopeStart - timestamp;
        //why weight multiplier: Because if a person remaining time is less than 12 hours, the calculation
        //would only give minWeightPenalty, because 2900 * 12hours/4days = 0
        if (timestamp >= slopeStart) return 0;
        return (weight.penaltyWeightMultiplier *
            weight.minWeightPenalty +
            (weight.penaltyWeightMultiplier * (weight.maxWeightPenalty - weight.minWeightPenalty) * remainingTime) /
            MAX_LOCK);
    }

    /**
     * @dev calculate the governance tokens to release
     * @notice
     */
    function _calculateGovnToken(uint256 amount, uint256 lockingPeriod) internal view returns (uint256 nVeFTHM) {
        //voteWeight = 365 * 24 * 60 * 60;
        nVeFTHM = (amount * lockingPeriod * POINT_MULTIPLIER) / voteLockWeight / POINT_MULTIPLIER;
        return nVeFTHM;
    }

    function onlyValidSharesAmount(LockedBalance memory lock) internal view{
        require(totalFTHMShares != 0, "Zero FTHM Shares");
        require(lock.FTHMShares != 0, "Zero Lock Shares");
    }
}
