// SPDX-License-Identifier: AGPL 3.0
// Copyright Fathom 2022
pragma solidity 0.8.16;
import "../StakingStructs.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./ILockPositionContext.sol";
contract LockPositionContext is AccessControlUpgradeable, ILockPositionContext{
    bytes32 public constant CONTEXT_CREATOR_ROLE = keccak256("CONTEXT_CREATOR_ROLE");
    bytes32 public constant CONTEXT_EXECUTOR_ROLE = keccak256("CONTEXT_EXECUTOR_ROLE");

    event LockPositionContextCreated(
        bytes32 indexed requestHash, 
        uint256 amount, 
        uint256 lockPeriod, 
        address indexed account);
    event LockPositionContextApproved(
        bytes32 indexed requestHash, 
        uint256 amount, 
        uint256 lockPeriod, 
        address indexed account);

    event LockPositionContextExecuted(
        bytes32 indexed requestHash, 
        uint256 amount, 
        uint256 lockPeriod, 
        address indexed account);

    
    error ZeroAmount();
    error ZeroAddress();
    
    mapping(bytes32 => CreateLockParams) public lockPositionContexts;
    mapping(bytes32 => bool) public createdContextKeys; 
    mapping(bytes32 => bool) public approvedContextKeys;
    mapping(bytes32 => bool) public executedContextKeys;
    mapping(address => CreateLockParams[]) public lockPositionContextsByAccount;
    uint256 public totalRequests;

    modifier onlyContextCreator() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(CONTEXT_CREATOR_ROLE, msg.sender), "only context creator");
        _;
    }

    modifier onlyContextExecutor() {
        require(hasRole(CONTEXT_EXECUTOR_ROLE, msg.sender), "only context executor");
        _;
    }

    constructor() {
        _disableInitializers();
    }
    function initialize(address _admin, address _stakingContract) external override initializer {
        __AccessControl_init_unchained();
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(CONTEXT_CREATOR_ROLE, _admin);
        _grantRole(CONTEXT_EXECUTOR_ROLE, _stakingContract);
    }
    

    function createLockPositionContext(
        uint256 _amount, 
        uint256 _lockPeriod, 
        address _account) 
    external onlyContextCreator override returns (bytes32) {
        require(_amount!=0,"bad amount");
        require(_account != address(0), "bad account");
        CreateLockParams memory lockPositionContext;
        lockPositionContext = CreateLockParams(
            _amount,
            _lockPeriod,
            _account);

        lockPositionContextsByAccount[_account].push(lockPositionContext);
        bytes32 requestHash = keccak256(abi.encode(lockPositionContextsByAccount[_account].length,_amount,_lockPeriod,_account));
        require(createdContextKeys[requestHash] == false, "lock position context already used");
        lockPositionContexts[requestHash] = lockPositionContext;
        createdContextKeys[requestHash] = true; 
        emit LockPositionContextCreated(requestHash, _amount, _lockPeriod, _account);
        return requestHash;
    }

    function approveLockPositionContext(bytes32 _requestHash) external  override {
        require(createdContextKeys[_requestHash], "lock position context not created");
        CreateLockParams memory lockPositionContext = lockPositionContexts[_requestHash];
        require(msg.sender == lockPositionContext.account,"bad caller");
        require(approvedContextKeys[_requestHash] == false, "lock position context already approved");
        approvedContextKeys[_requestHash]  = true;
        emit LockPositionContextApproved(_requestHash, lockPositionContext.amount, lockPositionContext.lockPeriod, lockPositionContext.account);
    }
    function getAndExecuteLockPositionContext(bytes32 _requestHash) external onlyContextExecutor override returns(CreateLockParams memory){
        
        require(createdContextKeys[_requestHash], "lock position context not created");
        require(approvedContextKeys[_requestHash], "lock position context not approved");
        require(!executedContextKeys[_requestHash], "lock position context already executed");
        executedContextKeys[_requestHash] = true;
        
        emit LockPositionContextExecuted(
            _requestHash, 
            lockPositionContexts[_requestHash].amount, 
            lockPositionContexts[_requestHash].lockPeriod,
            lockPositionContexts[_requestHash].account);

        return CreateLockParams(
            lockPositionContexts[_requestHash].amount,
            lockPositionContexts[_requestHash].lockPeriod,
            lockPositionContexts[_requestHash].account);

    }

    function getLockPositionContextsByAccount(address account) external view override returns(CreateLockParams[] memory){
        return lockPositionContextsByAccount[account];
    }

    function getLockPositionContextHashByAccountIndex(address account, uint256 lockPositionContextsId) external view override returns(bytes32){
        require(lockPositionContextsId > 0, "lock position context index must be greater than 0");
        require(lockPositionContextsId <= lockPositionContextsByAccount[account].length, "lock position context index out of bounds");
        CreateLockParams memory lockPositionContext = lockPositionContextsByAccount[account][lockPositionContextsId -1];
        return keccak256(abi.encode(lockPositionContextsId,lockPositionContext.amount,lockPositionContext.lockPeriod,lockPositionContext.account));
    }
}