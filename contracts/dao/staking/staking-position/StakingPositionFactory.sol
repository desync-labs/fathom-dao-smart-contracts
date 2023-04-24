// SPDX-License-Identifier: AGPL 3.0
// Copyright Fathom 2022

pragma solidity 0.8.16;
import "../../../common/security/AdminPausable.sol";
import "../interfaces/IStaking.sol";
import "./StakingPositionProxy.sol";
import "./interfaces/IStakingPositionFactory.sol";
contract StakingPositionFactory is AdminPausable,IStakingPositionFactory {

    mapping(address => address) public stakingPositionContract;
    address public admin;
    address public stakingContract;
    address public mainToken;
    address public stakingPositionImplementation;

    mapping(uint256 => address) public override streamRewardToken; 

    uint256 constant public MAIN_STREAM_ID = 0;

    function initialize(
        address _admin,
        address _stakingContract,
        address _mainToken,
        address _stakingPositionImplementation
    ) external override initializer {
        pausableInit(0, _admin);
        admin = _admin;
        stakingContract = _stakingContract;
        mainToken = _mainToken;
        stakingPositionImplementation = _stakingPositionImplementation;
        streamRewardToken[MAIN_STREAM_ID] = _mainToken;
    }

    function createStakingPositionContract(
        address account,
        address proxyAdmin
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        require(stakingPositionContract[account] == address(0), "Staking position already created");
        bytes memory data = abi.encodeWithSignature("initialize(address,address,address)", admin, stakingContract, mainToken);
        StakingPositionProxy proxy = new StakingPositionProxy(stakingPositionImplementation, proxyAdmin, data);
        stakingPositionContract[account] = address(proxy);
    }

    function updateStreamRewardToken(
        uint256 streamId,
        address rewardToken
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        streamRewardToken[streamId] = rewardToken;
    }
}