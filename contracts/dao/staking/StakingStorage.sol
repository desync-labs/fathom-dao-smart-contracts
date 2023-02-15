// SPDX-License-Identifier: AGPL 3.0
// Original Copyright Aurora
// Copyright Fathom 2022

pragma solidity 0.8.16;

import "./interfaces/IStakingStorage.sol";
import "./library/StakingLibrary.sol";

contract StakingStorage {
    uint256 internal constant MAIN_STREAM = 0;
    //Set according to Tokenomics: Max Supply: 1e9 * 1e18, weight = 1e3, tolerance for changes = 6, so 1e36
    uint256 internal constant RPS_MULTIPLIER = 1e36;
    uint128 internal constant POINT_MULTIPLIER = 1e18;
    uint32 internal constant ONE_MONTH = 2629746;
    uint32 internal constant ONE_YEAR = 31536000;
    uint32 internal constant ONE_DAY = 86400;
    //MAX_LOCK: It is a constant. One WEEK Added as a tolerance.

    uint256 public maxLockPeriod;
    ///@notice Checks if the staking is initialized

    uint256 public minLockPeriod;

    uint256 public maxLockPositions;
    mapping(address => mapping(uint256 => bool)) internal prohibitedEarlyWithdraw;

    uint256 internal touchedAt;

    ///@notice The below three are used for autocompounding feature and weighted shares
    uint256 public totalAmountOfStakedToken;
    uint256 public totalStreamShares;
    ///@notice voteToken -> vote Token
    uint256 public totalAmountOfVoteToken;

    uint256 public totalPenaltyBalance;
    /// _voteShareCoef the weight of vote tokens during shares distribution.
    /// Should be passed in proportion of 1000. ie, if you want weight of 2, have to pass 2000
    uint256 internal voteShareCoef;
    ///_voteLockWeight the weight that determines the amount of vote tokens to release
    uint256 internal voteLockCoef;

    address public mainToken;
    address public voteToken;
    address public vault;
    address public rewardsCalculator;
    bool internal councilsInitialized;
    bool internal mainStreamInitialized;

    ///Weighting coefficient for shares and penalties
    Weight public weight;

    mapping(address => User) public users;

    Stream[] internal streams;
    ///Mapping (user => LockedBalance) to keep locking information for each user
    mapping(address => LockedBalance[]) internal locks;
    mapping(uint256 => uint256) public streamTotalUserPendings;
}
