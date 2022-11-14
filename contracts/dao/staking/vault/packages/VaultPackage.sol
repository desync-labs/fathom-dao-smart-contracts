// SPDX-License-Identifier: AGPL 3.0
// Original Copyright Aurora
// Copyright Fathom 2022

pragma solidity 0.8.13;
import "../interfaces/IVault.sol";
import "../interfaces/IVaultEvents.sol";
import "../../../tokens/ERC20/IERC20.sol";
import "../../../../common/security/AdminPausable.sol";


// solhint-disable not-rely-on-time
contract VaultPackage is IVault, IVaultEvents, AdminPausable {
    bytes32 public constant REWARDS_OPERATOR_ROLE = 
        keccak256("REWARDS_OPERATOR_ROLE");

    mapping(address => bool) public override isSupportedToken;

    function initVault(address _admin, address _rewardsOperator, address[] calldata supportedTokens) external override {
        pausableInit(0, _admin);
        _grantRole(REWARDS_OPERATOR_ROLE, _rewardsOperator);

        for (uint i = 0; i < supportedTokens.length; i++) {
            _addSupportedToken(supportedTokens[i]);
        }
    }

    function payRewards(address _user, address _token, uint256 _amount) external override {
        require(hasRole(REWARDS_OPERATOR_ROLE, msg.sender),"payRewards: No role");
        require(isSupportedToken[_token], "Unsupported token");
        IERC20(_token).transfer(_user, _amount);
    }
    
    /// @notice adds token as a supproted rewards token by Vault
    /// supported tokens means any future stream token should be
    /// whitelisted here
    /// @param _token stream ERC20 token address
    function addSupportedToken(address _token) external override onlyRole(DEFAULT_ADMIN_ROLE) pausable(1) {
        _addSupportedToken(_token);
    }

    /// @notice removed token as a supproted rewards token by Treasury
    /// @param _token stream ERC20 token address
    function removeSupportedToken(address _token) external override onlyRole(DEFAULT_ADMIN_ROLE) pausable(1) {   
        require(isSupportedToken[_token], "Token does not exist");
        isSupportedToken[_token] = false;
        emit TokenRemoved(_token, msg.sender, block.timestamp);
    }

    function _addSupportedToken(address _token) internal {
        require(!isSupportedToken[_token], "Token already exists");
        isSupportedToken[_token] = true;
        emit TokenAdded(_token, msg.sender, block.timestamp);
    }
}
