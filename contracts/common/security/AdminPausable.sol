// SPDX-License-Identifier: AGPL 3.0
// Original Copyright Aurora
// Copyright Fathom 2022

pragma solidity 0.8.13;

import "./IAdminPausable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract AdminPausable is IAdminPausable, AccessControlUpgradeable {
    bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");
    address public admin;
    uint256 public paused;
    bool internal initialized;

    modifier pausable(uint256 flag) {
        require((paused & flag) == 0 || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "paused contract");
        _;
    }

    /// @dev adminPause pauses this contract. Only pause role or default
    /// admin role can access this function.
    /// @param flags flags variable is used for pausing this contract.
    function adminPause(uint256 flags) external override onlyRole(PAUSE_ROLE){
        // pause role can pause the contract, however only default admin role can unpause
        require((paused & flags) == paused || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "only admin can unpause");
        paused = flags;
    }
    /// @dev adminSstore updates the state variable value.
    /// only default admin role can call this function.
    /// @param key is the storage slot of the state variable
    /// @param value is the state variable value
    function adminSstoreUint(uint256 key, uint256 value)
        external
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        assembly {
            sstore(key, value)
        }
    }

        /// @dev adminSstore updates the state variable value.
    /// only default admin role can call this function.
    /// @param key is the storage slot of the state variable
    /// @param value is the state variable value
    function adminSstoreAddress(uint256 key, address value)
        external
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        assembly {
            sstore(key, value)
        }
    }

    /// @dev adminSstoreWithMask similar to adminSstore except
    /// it updates the state variable value after xor-ing this value
    /// with the old value and the mask, so the new value should be
    /// a result of xor(and(xor(value, oldval), mask), oldval).
    /// Only default admin role can call this function.
    /// @param key is the storage slot of the state variable
    /// @param value is the state variable value
    /// @param mask this value is used in calculating the new value
    function adminSstoreWithMask(
        uint256 key,
        uint256 value,
        uint256 mask
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        assembly {
            let oldval := sload(key)
            sstore(key, xor(and(xor(value, oldval), mask), oldval))
        }
    }

    function pausableInit(uint256 _flags, address _admin) internal initializer {
        __AccessControl_init_unchained();
        __Context_init_unchained();
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(PAUSE_ROLE, _admin);
        paused = _flags;
    }
}
