// Copyright SECURRENCY INC.
// SPDX-License-Identifier: AGPL 3.0
pragma solidity ^0.8.13;

import "../StakingStructs.sol";
import "../interfaces/IStakingGetter.sol";
import "../interfaces/IStakingHandler.sol";
import "../interfaces/IStakingStorage.sol";
import "../interfaces/IStakingSetter.sol";
import "../utils/interfaces/IAdminPausable.sol";

interface IStakingHelper is IStakingGetter, IStakingHandler, IStakingStorage, IStakingSetter, IAdminPausable {

}
