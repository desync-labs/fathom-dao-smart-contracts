// SPDX-License-Identifier: MIT
// Copyright Fathom 2022

pragma solidity 0.8.16;

import "./interfaces/IMultiSigWallet.sol";
import "../../common/Address.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// solhint-disable not-rely-on-time
contract MultiSigWallet is IMultiSigWallet {
    using Address for address;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Transaction {
        address to;
        bool executed;
        bytes data;
        uint256 value;
        uint256 numConfirmations;
        uint256 expireTimestamp;
    }

    address public governor;
    uint256 public numConfirmationsRequired;
    mapping(address => bool) public isOwner;
    Transaction[] public transactions;

    EnumerableSet.AddressSet internal owners;
    mapping(address => bytes32) internal allowlistedBytesCode;
    mapping(address => EnumerableSet.UintSet) internal confirmedTransactionsByOwner;

    uint256 public constant MINIMUM_LIFETIME = 86400; //oneDay
    uint256 public constant MAX_OWNER_COUNT = 50;

    error TxDoesNotExist();
    error TxAlreadyExecuted();
    error TxAlreadyConfirmed();
    error TxExpired();
    error OnlyOwnerOrGov();
    error InvalidRequirement();
    error OwnerNotFound();
    error LifetimeMinimumNotMet();
    error InsufficientBalance();
    error InsufficientValue();
    error InvalidTargetCode();
    error OwnersLimitReached();
    error OwnersRequired();
    error InvalidOwner();
    error OwnerNotUnique();
    error TargetCodeChanged();
    error OwnerAlreadyExists();
    error TxNotConfirmed();

    modifier onlyOwnerOrGov() {
        if (!isOwner[msg.sender] && governor != msg.sender) {
            revert OnlyOwnerOrGov();
        }
        _;
    }

    modifier txExists(uint256 _txIndex) {
        if (_txIndex >= transactions.length) {
            revert TxDoesNotExist();
        }
        _;
    }

    modifier notExecuted(uint256 _txIndex) {
        if (transactions[_txIndex].executed) {
            revert TxAlreadyExecuted();
        }
        _;
    }

    modifier notConfirmed(uint256 _txIndex) {
        if (confirmedTransactionsByOwner[msg.sender].contains(_txIndex)) {
            revert TxAlreadyConfirmed();
        }
        _;
    }

    modifier notExpired(uint256 _txIndex) {
        if (transactions[_txIndex].expireTimestamp < block.timestamp && transactions[_txIndex].expireTimestamp != 0) {
            revert TxExpired();
        }
        _;
    }

    modifier onlyWallet() {
        if (msg.sender != address(this)) {
            revert OnlyOwnerOrGov();
        }
        _;
    }

    modifier validRequirement(uint256 ownerCount, uint256 _required) {
        if (ownerCount == 0 || ownerCount > MAX_OWNER_COUNT || _required > ownerCount || !(ownerCount > 1 ? _required > 1 : _required > 0)) {
            revert InvalidRequirement();
        }
        _;
    }

    modifier ownerExists(address owner) {
        if (!isOwner[owner]) {
            revert OwnerNotFound();
        }
        _;
    }

    modifier validateSubmitTxInputs(
        address _to,
        uint256 _value,
        bytes memory _data,
        uint256 _lifetime
    ) {
        if (_lifetime < MINIMUM_LIFETIME && _lifetime > 0) {
            revert LifetimeMinimumNotMet();
        }

        if (!_to.isContract()) {
            if (_data.length > 0 || _value == 0) {
                revert InsufficientValue();
            }
        }
        if (address(this).balance < _value) {
            revert InsufficientBalance();
        }
        _;
    }

    constructor(address[] memory _owners, uint256 _numConfirmationsRequired, address _governor) {
        if (_owners.length > MAX_OWNER_COUNT) {
            revert OwnersLimitReached();
        }
        if (_owners.length == 0) {
            revert OwnersRequired();
        }
        if (_numConfirmationsRequired == 0 || _numConfirmationsRequired > _owners.length) {
            revert InvalidRequirement();
        }

        governor = _governor;

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            if (owner == address(0)) {
                revert InvalidOwner();
            }
            if (isOwner[owner]) {
                revert OwnerNotUnique();
            }

            isOwner[owner] = true;
            owners.add(owner);
            emit OwnerAddition(owner);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
    }

    receive() external payable override {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function removeOwner(address owner) external override onlyWallet ownerExists(owner) {
        isOwner[owner] = false;
        owners.remove(owner);

        if (numConfirmationsRequired > owners.length()) changeRequirement(owners.length());

        uint256 nConfirmedTxnByOwner = confirmedTransactionsByOwner[owner].length();

        for (uint i = 0; i < nConfirmedTxnByOwner; i++) {
            uint256 _txIndex = confirmedTransactionsByOwner[owner].at(i);
            Transaction storage transaction = transactions[_txIndex];
            transaction.numConfirmations -= 1;
            confirmedTransactionsByOwner[owner].remove(_txIndex);
            emit RevokeConfirmation(owner, _txIndex);
        }
        emit OwnerRemoval(owner);
    }

    function addOwners(
        address[] calldata _owners
    ) external override onlyWallet validRequirement(owners.length() + _owners.length, numConfirmationsRequired + _owners.length) {
        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            if (owner == address(0)) {
                revert InvalidOwner();
            }
            _requireNewOwner(owner);

            isOwner[owner] = true;
            owners.add(owner);
            emit OwnerAddition(owner);
        }

        changeRequirement(numConfirmationsRequired + _owners.length);
    }

    function submitTransaction(
        address _to,
        uint256 _value,
        bytes calldata _data,
        uint256 _lifetime
    ) external override onlyOwnerOrGov validateSubmitTxInputs(_to, _value, _data, _lifetime) {
        uint256 txIndex = transactions.length;
        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                numConfirmations: 0,
                expireTimestamp: _lifetime == 0 ? 0 : block.timestamp + _lifetime
            })
        );

        allowlistedBytesCode[_to] = _to.getExtCodeHash();

        emit SubmitTransaction(txIndex, msg.sender, _to, _value, _data);
    }

    function confirmTransaction(
        uint256 _txIndex
    ) external override onlyOwnerOrGov txExists(_txIndex) notExecuted(_txIndex) notConfirmed(_txIndex) notExpired(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];

        _requireTargetCodeNotChanged(transaction.to);

        transaction.numConfirmations += 1;
        confirmedTransactionsByOwner[msg.sender].add(_txIndex);

        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    function executeTransaction(uint256 _txIndex) external override onlyOwnerOrGov txExists(_txIndex) notExecuted(_txIndex) notExpired(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];

        _requireTargetCodeNotChanged(transaction.to);

        if (transaction.numConfirmations < numConfirmationsRequired) {
            revert TxNotConfirmed();
        }

        transaction.executed = true;

        (bool success, bytes memory data) = transaction.to.call{ value: transaction.value }(transaction.data);

        if (success) {
            emit ExecuteTransaction(msg.sender, _txIndex);
        } else {
            Address.verifyCallResult(success, data, "executeTransaction: reverted without reason");
        }
    }

    function revokeConfirmation(uint256 _txIndex) external override onlyOwnerOrGov txExists(_txIndex) notExecuted(_txIndex) notExpired(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];

        if (!confirmedTransactionsByOwner[msg.sender].contains(_txIndex)) {
            revert TxNotConfirmed();
        }

        transaction.numConfirmations -= 1;
        confirmedTransactionsByOwner[msg.sender].remove(_txIndex);
        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    function getOwners() external view override returns (address[] memory) {
        return owners.values();
    }

    function getTransactionCount() external view override returns (uint256) {
        return transactions.length;
    }

    function getTransaction(
        uint256 _txIndex
    )
        external
        view
        override
        returns (address to, uint256 value, bytes memory data, bool executed, uint256 numConfirmations, uint256 expireTimestamp)
    {
        Transaction memory transaction = transactions[_txIndex];

        return (transaction.to, transaction.value, transaction.data, transaction.executed, transaction.numConfirmations, transaction.expireTimestamp);
    }

    function changeRequirement(uint256 _required) public override onlyWallet validRequirement(owners.length(), _required) {
        numConfirmationsRequired = _required;
        emit RequirementChange(_required);
    }

    function _requireNewOwner(address owner) internal view {
        if (isOwner[owner]) {
            revert OwnerAlreadyExists();
        }
    }

    function _requireTargetCodeNotChanged(address target) internal view {
        if (allowlistedBytesCode[target] != target.getExtCodeHash()) {
            revert TargetCodeChanged();
        }
    }
}
