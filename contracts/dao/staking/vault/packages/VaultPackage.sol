// SPDX-License-Identifier: AGPL 3.0
// Original Copyright Aurora
// Copyright Fathom 2022

pragma solidity 0.8.13;
import "../interfaces/IVault.sol";
import "../interfaces/IVaultEvents.sol";
import "../../../tokens/ERC20/IERC20.sol";
import "../../../../common/security/AdminPausable.sol";
import "../../../../common/SafeERC20.sol";
// solhint-disable not-rely-on-time
contract VaultPackage is IVault, IVaultEvents, AdminPausable {
    using SafeERC20 for IERC20;
    bool private vaultInitialized;
    bytes32 public constant REWARDS_OPERATOR_ROLE = keccak256("REWARDS_OPERATOR_ROLE");
    mapping(address => uint256) public deposited;
    mapping(address => bool) public override isSupportedToken;
    address[] public listOfSupportedTokens;
    
    function initVault(address _admin,address[] calldata supportedTokens) external override {
        require(!vaultInitialized, "Vault: Already Initialized");
        vaultInitialized = true;
        for (uint i = 0; i < supportedTokens.length; i++) {
            _addSupportedToken(supportedTokens[i]);
        }
        pausableInit(0, _admin);
    }

    function addRewardsOperator(address _rewardsOperator) external override onlyRole(DEFAULT_ADMIN_ROLE){
        _grantRole(REWARDS_OPERATOR_ROLE, _rewardsOperator);
    }

    function payRewards(address _user, address _token, uint256 _amount) external override pausable(1){
        require(hasRole(REWARDS_OPERATOR_ROLE, msg.sender), "payRewards: No role");
        require(isSupportedToken[_token], "Unsupported token");
        //require(deposited[_token] >= _amount,"payRewards: not enough deposit");
       // deposited[_token] -= _amount;
        IERC20(_token).safeTransfer(_user,_amount);
    }

    function deposit(address _user, address _token, uint256 _amount) external override pausable(1) {
        require(hasRole(REWARDS_OPERATOR_ROLE, msg.sender), "deposit: No role");
        require(isSupportedToken[_token], "Unsupported token");
        deposited[_token] += _amount;
        IERC20(_token).safeTransferFrom(_user, address(this),_amount);
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
        _removeToken(_token);
        emit TokenRemoved(_token, msg.sender, block.timestamp);
    }

    function emergencyStop() external override onlyRole(DEFAULT_ADMIN_ROLE){
        _adminPause(1);
    }

    function emergencyWithdraw(address withdrawTo) external override onlyRole(DEFAULT_ADMIN_ROLE){
        for(uint i = 0; i < listOfSupportedTokens.length;i++)
        {
            uint256 balance = IERC20(listOfSupportedTokens[i]).balanceOf(address(this));
            IERC20(listOfSupportedTokens[i]).safeTransfer(withdrawTo, balance);
        }
    }

    function _addSupportedToken(address _token) internal {
        require(!isSupportedToken[_token], "Token already exists");
        isSupportedToken[_token] = true;
        listOfSupportedTokens.push(_token);
        emit TokenAdded(_token, msg.sender, block.timestamp);
    }

    function _removeToken(address _token) internal {
        for(uint i = 0; i < listOfSupportedTokens.length; i++) {
            if(listOfSupportedTokens[i] == _token){
                listOfSupportedTokens[i] = listOfSupportedTokens[listOfSupportedTokens.length -1];
                break;
            }
        }
        listOfSupportedTokens.pop();
    }
}
