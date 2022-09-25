// Copyright SECURRENCY INC.
// SPDX-License-Identifier: AGPL 3.0
pragma solidity ^0.8.13;
import "../interfaces/IStakingGetter.sol";
import "./IStakingHelper.sol";
import "../StakingStructs.sol";
import "./IStakingGetterHelper.sol";
contract StakingGettersHelper  is IStakingGetterHelper{

    address private stakingContract;

    constructor(address _stakingContract) {
        stakingContract = _stakingContract;
    }
    function getLatestRewardsPerShare(uint256 streamId) external override view  returns (uint256) {
        return IStakingHelper(stakingContract).getLatestRewardsPerShare(streamId);
    }

    function getLockInfo(address account, uint256 lockId) external override view  returns (LockedBalance memory) {

        LockedBalance[] memory locks = IStakingHelper(stakingContract).getAllLocks(account);
        require(lockId <= locks.length, "out of index");
        return locks[lockId - 1];
    }

    function getLocksLength(address account) external override view returns (uint256) {
        LockedBalance[] memory locks = IStakingHelper(stakingContract).getAllLocks(account);
        return locks.length;
    }

    function getLock(address account, uint lockId) external
                     override view returns(uint128, uint128, uint128, uint128, uint64, address){
        LockedBalance[] memory locks = IStakingHelper(stakingContract).getAllLocks(account);
        LockedBalance memory lock = locks[lockId - 1];
        require(lockId <= locks.length, "out of index");
        return(
            lock.amountOfMAINTkn,
            lock.amountOfveMAINTkn,
            lock.mainTknShares,
            lock.positionStreamShares,
            lock.end,
            lock.owner
        );
    }

  

    /// @dev gets the total user deposit
    /// @param account the user address
    /// @return user total deposit in (Main Token)
    function getUserTotalDeposit(address account)
        external
        view
        override
        returns (uint256)
    {   
        LockedBalance[] memory locks = IStakingHelper(stakingContract).getAllLocks(account);
        uint totalDeposit = 0;
        for(uint i = 0;i<locks.length;i++){
            totalDeposit += locks[i].amountOfMAINTkn;
        }
        return totalDeposit;
    }




}
