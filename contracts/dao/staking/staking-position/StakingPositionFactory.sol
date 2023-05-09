// SPDX-License-Identifier: AGPL 3.0
// Copyright Fathom 2022

pragma solidity 0.8.16;
import "../../../common/security/AdminPausable.sol";
import "../../../common/SafeERC20.sol";

import "../interfaces/IStaking.sol";
import "./StakingPosition.sol";
import "./interfaces/IStakingPositionFactory.sol";
import "./interfaces/IStakingPosition.sol";
contract StakingPositionFactory is AdminPausable,IStakingPositionFactory {
    using SafeERC20 for IERC20;

    bytes32 public constant STAKING_POSITION_MANAGER_ROLE = keccak256("STAKING_POSITION_MANAGER_ROLE");
    mapping(address => address) public stakingPositionContract;
    
    address public override stakingContract;
    address public override mainToken;
    address public override voteToken;
    address public admin;
    address public proxyAdmin;

    mapping(uint256 => address) public override streamRewardToken; 

    uint256 constant public MAIN_STREAM_ID = 0;

    event LogCreateStakingPositionContract(
        address indexed account,
        address indexed stakingPositionContract
    );

    event LogUpdateStreamRewardToken(
        uint256 indexed streamId,
        address indexed rewardToken
    );
    
    
    event LogUpdateStakingContract(
        address oldStakingContract,
        address newStakingContract
    );

    function initialize(
        address _admin,
        address _stakingContract,
        address _mainToken,
        address _voteToken,
        address _proxyAdmin
    ) external override initializer {
        require(Address.isContract(_stakingContract), "bad staking contract");
        require(Address.isContract(_mainToken), "bad main token contract");
        require(Address.isContract(_voteToken),"bad vote token");
        require(Address.isContract(_proxyAdmin),"bad proxy admin");
        require(_admin != address(0), "bad owner");
        admin = _admin;
        pausableInit(0, _admin);
        _grantRole(STAKING_POSITION_MANAGER_ROLE, _admin);
        
        stakingContract = _stakingContract;
        mainToken = _mainToken;
        streamRewardToken[MAIN_STREAM_ID] = _mainToken;
        voteToken = _voteToken;
        proxyAdmin = _proxyAdmin;
    }

    function createStakingPositionContract(
        address _account
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        require(stakingPositionContract[_account] == address(0), "Staking position already created");
        require(_account != address(0), "bad account");
        
        StakingPosition newStakingPositionContract = new StakingPosition(
            admin, 
            mainToken,
            address(this), 
            _account
        );
        
        stakingPositionContract[_account] = address(newStakingPositionContract);
        
        emit LogCreateStakingPositionContract(
            _account,
            address(newStakingPositionContract)
        );
    }

    function updateStreamRewardToken(
        uint256 streamId,
        address rewardToken
    ) external override onlyRole(STAKING_POSITION_MANAGER_ROLE) {
        require(Address.isContract(rewardToken), "bad reward token");
        streamRewardToken[streamId] = rewardToken;
        emit LogUpdateStreamRewardToken(
            streamId,
            rewardToken
        );
    }

    function updateStakingContract(
        address _stakingContract
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        require(Address.isContract(_stakingContract), "bad staking contract");
        stakingContract = _stakingContract;
        emit LogUpdateStakingContract(
            stakingContract,
            _stakingContract
        );
    }

    function getStakingPositionContractAddress(
        address account
    ) external view override returns (address) {
        return stakingPositionContract[account];
    }

    function getStreamRewardToken(
        uint256 streamId
    ) external view override returns (address) {
        return streamRewardToken[streamId];
    }
}