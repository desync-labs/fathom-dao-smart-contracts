// SPDX-License-Identifier: AGPL 3.0
// Original Copyright Aurora
// Copyright Fathom 2022

pragma solidity 0.8.13;
import "../interfaces/IVault.sol";
import "../interfaces/IVaultEvents.sol";
import "../../../tokens/ERC20/IERC20.sol";
import "../../../../common/access/AccessControl.sol";


// solhint-disable not-rely-on-time
contract VaultPackage is IVault, IVaultEvents, AccessControl {
    bytes32 public constant ADMIN_ROLE =
        keccak256("ADMIN_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = 
        keccak256("GOVERNANCE_ROLE");
    bytes32 public constant TREASURY_MANAGER_ROLE = 
        keccak256("TREASURY_MANAGER_ROLE");

    bool private initialized;
    address public admin;
    

    mapping(address => bool) public override isSupportedToken;

    function initVault() external override {
        require(!initialized, "AdminControlledInit: already initialized");
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(GOVERNANCE_ROLE, msg.sender);
        _grantRole(TREASURY_MANAGER_ROLE, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        initialized = true;
    }

    //STAKING CONTRACT SHOULD BE ABLE TO CALL THIS
    function payRewards(
        address _user,
        address _token,
        uint256 _amount
    ) external override{
        require(hasRole(ADMIN_ROLE, msg.sender) 
                || hasRole(GOVERNANCE_ROLE,msg.sender),"payRewards: No role");
        require(isSupportedToken[_token], "Unsupported token");
        IERC20(_token).transfer(_user, _amount);
    }
    
    /// @notice adds token as a supproted rewards token by Vault
    /// supported tokens means any future stream token should be
    /// whitelisted here
    /// @param _token stream ERC20 token address
    function addSupportedToken(
        address _token //pausable(1)
    ) external override  onlyRole(TREASURY_MANAGER_ROLE)
    {
        require(!isSupportedToken[_token], "Token already exists");
        isSupportedToken[_token] = true;
        emit TokenAdded(_token, msg.sender, block.timestamp);
    }

    /// @notice removed token as a supproted rewards token by Treasury
    /// @param _token stream ERC20 token address
    function removeSupportedToken(
        address _token // pausable(1)
    ) external override onlyRole(TREASURY_MANAGER_ROLE)
    {
        require(isSupportedToken[_token], "Token does not exist");
        isSupportedToken[_token] = false;
        emit TokenRemoved(_token, msg.sender, block.timestamp);
    }
}
