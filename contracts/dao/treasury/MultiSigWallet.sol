// SPDX-License-Identifier: MIT
// Copyright Fathom 2022

pragma solidity 0.8.13;

import "./interfaces/IMultiSigWallet.sol";

contract MultiSigWallet is IMultiSigWallet {
    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        uint numConfirmations;
        uint expireTimestamp;
    }

    uint public constant MAX_OWNER_COUNT = 50;

    address[] public owners;
    address public governor;

    uint public numConfirmationsRequired;
    uint public lastDisabledTransactionIndex;

    mapping(address => bool) public isOwner;
    mapping(uint => mapping(address => bool)) public isConfirmed;

    Transaction[] public transactions;

    modifier onlyOwnerOrGov() {
        require(isOwner[msg.sender] || governor == msg.sender, "MultiSig: MultiSigWallet, onlyOwnerOrGov(): Neither owner nor governor");
        _;
    }

    modifier txExists(uint _txIndex) {
        require(_txIndex < transactions.length, "MultiSig: tx does not exist");
        _;
    }

    modifier notExecuted(uint _txIndex) {
        require(!transactions[_txIndex].executed, "MultiSig: tx already executed");
        _;
    }

    modifier notConfirmed(uint _txIndex) {
        require(!isConfirmed[_txIndex][msg.sender], "MultiSig: tx already confirmed");
        _;
    }

    modifier notDisabled(uint _txIndex) {
        require(_txIndex >= lastDisabledTransactionIndex, "MultiSig: old txs has been disabled");
        _;
    }

    modifier notExpired(uint _txIndex) {
        require(transactions[_txIndex].expireTimestamp >= block.timestamp || transactions[_txIndex].expireTimestamp == 0, "MultiSig: tx expired");
        _;
    }

    modifier onlyWallet() {
        require(msg.sender == address(this), "MultiSig: Only this wallet can use this funciton");
        _;
    }

    modifier validRequirement(uint ownerCount, uint _required) {
        require(
            ownerCount > 0 && ownerCount <= MAX_OWNER_COUNT && _required <= ownerCount && ownerCount > 1 ? _required > 1 : _required > 0,
            "MultiSig: Invalid requirement"
        );
        _;
    }

    modifier ownerExists(address owner) {
        require(isOwner[owner], "MultiSig: !isOwner[owner]");
        _;
    }

    constructor(address[] memory _owners, uint _numConfirmationsRequired, address _governor) {
        governor = _governor;
        require(_owners.length <= MAX_OWNER_COUNT, "owners limit reached");
        require(_owners.length > 0, "owners required");
        require(_numConfirmationsRequired > 0 && _numConfirmationsRequired <= _owners.length, "invalid number of required confirmations");

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
    }

    receive() external payable override {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function removeOwner(address owner) public override onlyWallet ownerExists(owner) {
        isOwner[owner] = false;
        for (uint i = 0; i < owners.length - 1; i++)
            if (owners[i] == owner) {
                owners[i] = owners[owners.length - 1];
                break;
            }
        owners.pop();

        if (numConfirmationsRequired > owners.length) changeRequirement(owners.length);

        lastDisabledTransactionIndex = getTransactionCount();

        emit OwnerRemoval(owner);
    }

    function addOwners(
        address[] memory _owners
    ) public override onlyWallet validRequirement(owners.length + _owners.length, numConfirmationsRequired + _owners.length) {
        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "MultiSig: owner address == 0");
            _requireNewOwner(owner);

            isOwner[owner] = true;
            owners.push(owner);
            emit OwnerAddition(owner);
        }

        changeRequirement(numConfirmationsRequired + _owners.length);
    }

    function changeRequirement(uint _required) public override onlyWallet validRequirement(owners.length, _required) {
        numConfirmationsRequired = _required;
        emit RequirementChange(_required);
    }

    function submitTransaction(address _to, uint _value, bytes memory _data, uint _expireTimestamp) public override onlyOwnerOrGov {
        require(_expireTimestamp >= block.timestamp || _expireTimestamp == 0, "already expired");

        uint txIndex = transactions.length;

        transactions.push(
            Transaction({ to: _to, value: _value, data: _data, executed: false, numConfirmations: 0, expireTimestamp: _expireTimestamp })
        );

        emit SubmitTransaction(txIndex, msg.sender, _to, _value, _data);
    }

    function confirmTransaction(
        uint _txIndex
    ) public override onlyOwnerOrGov txExists(_txIndex) notExecuted(_txIndex) notConfirmed(_txIndex) notDisabled(_txIndex) notExpired(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations += 1;
        isConfirmed[_txIndex][msg.sender] = true;

        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    function executeTransaction(
        uint _txIndex
    ) public override onlyOwnerOrGov txExists(_txIndex) notExecuted(_txIndex) notDisabled(_txIndex) notExpired(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];

        require(transaction.numConfirmations >= numConfirmationsRequired, "cannot execute tx");

        transaction.executed = true;

        (bool success, ) = transaction.to.call{ value: transaction.value }(transaction.data);
        require(success, "tx failed");

        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    function revokeConfirmation(
        uint _txIndex
    ) public override onlyOwnerOrGov txExists(_txIndex) notExecuted(_txIndex) notDisabled(_txIndex) notExpired(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];

        require(isConfirmed[_txIndex][msg.sender], "tx not confirmed");

        transaction.numConfirmations -= 1;
        isConfirmed[_txIndex][msg.sender] = false;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    function getOwners() public view override returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() public view override returns (uint) {
        return transactions.length;
    }

    function getTransaction(
        uint _txIndex
    ) public view override returns (address to, uint value, bytes memory data, bool executed, uint numConfirmations, uint expireTimestamp) {
        Transaction storage transaction = transactions[_txIndex];

        return (transaction.to, transaction.value, transaction.data, transaction.executed, transaction.numConfirmations, transaction.expireTimestamp);
    }

    function _requireNewOwner(address owner) internal view {
        require(!isOwner[owner], "MultiSig: Owner already exists");
    }
}
