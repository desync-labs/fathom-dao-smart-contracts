// SPDX-License-Identifier: AGPL 3.0
// Copyright Fathom 2022

pragma solidity 0.8.16;
import "../../../common/security/AdminPausable.sol";
import "../interfaces/IStaking.sol";
import "./proxy/StakingPositionProxy.sol";
import "./interfaces/IStakingPositionFactory.sol";
import "./interfaces/IStakingPosition.sol";
contract StakingPositionFactory is AdminPausable,IStakingPositionFactory {
    bytes32 public constant STAKING_POSITION_MANAGER_ROLE = keccak256("STAKING_POSITION_MANAGER_ROLE");
    mapping(address => address) public stakingPositionContract;
    
    address public override stakingContract;
    address public override mainToken;
    address public override voteToken;
    address public stakingPositionImplementation;
    address public admin;
    address public proxyAdmin;

    mapping(uint256 => address) public override streamRewardToken; 
    uint256 constant public MAIN_STREAM_ID = 0;
    function initialize(
        address _admin,
        address _stakingContract,
        address _mainToken,
        address _stakingPositionImplementation,
        address _voteToken,
        address _proxyAdmin
    ) external override initializer {
        require(Address.isContract(_stakingContract), "bad staking contract");
        require(Address.isContract(_mainToken), "bad main token contract");
        require(Address.isContract(_stakingPositionImplementation), "bad staking position implementation");
        require(Address.isContract(_voteToken),"bad vote token");
        require(Address.isContract(_proxyAdmin),"bad proxy admin");
        require(_admin != address(0), "bad owner");
        admin = _admin;
        pausableInit(0, _admin);
        _grantRole(STAKING_POSITION_MANAGER_ROLE, _admin);
        
        stakingContract = _stakingContract;
        mainToken = _mainToken;
        stakingPositionImplementation = _stakingPositionImplementation;
        streamRewardToken[MAIN_STREAM_ID] = _mainToken;
        voteToken = _voteToken;
        proxyAdmin = _proxyAdmin;
    }

    function createStakingPositionContract(
        address _account
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        require(stakingPositionContract[_account] == address(0), "Staking position already created");
        require(_account != address(0), "bad account");
        bytes memory data = abi.encodeWithSelector(
            IStakingPosition(address(0)).initialize.selector,
            admin, 
            mainToken,
            address(this), 
            _account);
        StakingPositionProxy proxy = new StakingPositionProxy(stakingPositionImplementation, proxyAdmin, data);
        stakingPositionContract[_account] = address(proxy);
    }


    function updateStreamRewardToken(
        uint256 streamId,
        address rewardToken
    ) external override onlyRole(STAKING_POSITION_MANAGER_ROLE) {
        require(Address.isContract(rewardToken), "bad reward token");
        streamRewardToken[streamId] = rewardToken;
    }

    function updateStakingPositionImplementation(
        address _stakingPositionImplementation
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        require(Address.isContract(_stakingPositionImplementation), "bad staking position implementation");
        stakingPositionImplementation = _stakingPositionImplementation;
    }

    function updateStakingContract(
        address _stakingContract
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        require(Address.isContract(_stakingContract), "bad staking contract");
        stakingContract = _stakingContract;
    }

    function getStakingPositionContractAddress(
        address account
    ) external view override returns (address) {
        return stakingPositionContract[account];
    }

}