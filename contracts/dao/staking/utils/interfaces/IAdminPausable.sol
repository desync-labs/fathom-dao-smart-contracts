// SPDX-License-Identifier: AGPL 3.0
// Original Copyright Aurora
// Copyright Fathom 2022

pragma solidity ^0.8.13;

interface IAdminPausable {
    function adminPause(uint256 flags) external;
    function adminSstoreUint(uint256 key, uint256 value)
        external;

    function adminSstoreAddress(uint256 key, address value)
        external;

    function adminSstoreWithMask(
        uint256 key,
        uint256 value,
        uint256 mask
    ) external;
}
