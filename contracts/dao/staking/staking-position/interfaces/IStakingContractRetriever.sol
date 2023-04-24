// SPDX-License-Identifier: AGPL 3.0
// Copyright Fathom 2022
pragma solidity 0.8.16;
import "../StakingStructs.sol";
interface IStakingContractRetriever {
    function users(address) external view returns(User memory);
}