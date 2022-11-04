// SPDX-License-Identifier: MIT
// Copyright Fathom 2022

pragma solidity ^0.8.13;

import "../governance/TokenTimelock.sol";

contract FTHMTokenTimelock is TokenTimelock {
    constructor(IERC20 token, address beneficiary, uint256 releaseTime)
        TokenTimelock(token, beneficiary, releaseTime)
    {}
}