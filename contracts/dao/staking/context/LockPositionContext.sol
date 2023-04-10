// SPDX-License-Identifier: AGPL 3.0
// Copyright Fathom 2022
pragma solidity 0.8.16;
import "../StakingStructs.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./ILockPositionContext.sol";
contract LockPositionContext is AccessControlUpgradeable, ILockPositionContext{

    bytes32 public constant CONTEXT_CREATOR_ROLE = keccak256("CONTEXT_CREATOR_ROLE");
    bytes32 public constant CONTEXT_EXECUTOR_ROLE = keccak256("CONTEXT_EXECUTOR_ROLE");

    mapping(bytes32 => CreateLockParams) public lockPositionContexts;
    mapping(bytes32 => bool) public createdContextKeys; 
    mapping(bytes32 => bool) public approvedContextKeys;
    mapping(bytes32 => bool) public executedContextKeys;
    uint256 public totalRequests;

    modifier onlyContextCreator() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(CONTEXT_CREATOR_ROLE, msg.sender), "only context creator");
        _;
    }

    modifier onlyContextExecutor() {
        require(hasRole(CONTEXT_EXECUTOR_ROLE, msg.sender), "only context executor");
        _;
    }
    function initialize(address _admin, address _stakingContract) external override initializer {
        __AccessControl_init_unchained();
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(CONTEXT_CREATOR_ROLE, _admin);
        _grantRole(CONTEXT_EXECUTOR_ROLE, _stakingContract);
    }
    

    function createLockPositionContext(uint256 amount, uint256 lockPeriod, address account) external onlyContextCreator override returns (bytes32) {
        totalRequests++;
        bytes32 requestHash = keccak256(abi.encode(totalRequests,amount,lockPeriod,account));
        require(createdContextKeys[requestHash] == false, "lock position context already used");
        lockPositionContexts[requestHash] = CreateLockParams(
            amount,
            lockPeriod,
            account);
        createdContextKeys[requestHash] = true; 
        return requestHash;
    }

    function approveLockPositionContext(bytes32 _requestHash) external  override {
        require(msg.sender == lockPositionContexts[_requestHash].account,"lock position context not account");
        require(createdContextKeys[_requestHash], "lock position context not created");
        require(approvedContextKeys[_requestHash] == false, "lock position context already approved");
        approvedContextKeys[_requestHash]  = true;
    }

    function executeLockPositionContext(bytes32 _requestHash) external override returns(CreateLockParams memory){
        require(createdContextKeys[_requestHash], "lock position context not created");
        require(approvedContextKeys[_requestHash], "lock position context not approved");
        require(!executedContextKeys[_requestHash], "lock position context already executed");
        executedContextKeys[_requestHash] = true;
        return CreateLockParams(
            lockPositionContexts[_requestHash].amount,
            lockPositionContexts[_requestHash].lockPeriod,
            lockPositionContexts[_requestHash].account);

    }
}