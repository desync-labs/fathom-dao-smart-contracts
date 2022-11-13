// SPDX-License-Identifier: MIT
// Copyright Fathom 2022

pragma solidity 0.8.13;

interface IMultiSigWallet {
    event Deposit(address indexed sender, uint amount, uint balance);
    event SubmitTransaction(uint indexed txIndex, address indexed owner, address indexed to, uint value, bytes data);
    event ConfirmTransaction(address indexed owner, uint indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);
    event OwnerRemoval(address indexed owner);
    event OwnerAddition(address indexed owner);
    event RequirementChange(uint required);

    receive() external payable;

    function removeOwner(address owner) external;

    function addOwner(address owner) external;

    function changeRequirement(uint _required) external;

    function submitTransaction(
        address _to,
        uint _value,
        bytes memory _data
    ) external;

    function confirmTransaction(uint _txIndex) external;

    function executeTransaction(uint _txIndex) external;

    function revokeConfirmation(uint _txIndex) external;

    function getOwners() external returns (address[] memory);

    function getTransactionCount() external returns (uint);

    function getTransaction(uint _txIndex)
        external
        returns (
            address to,
            uint value,
            bytes memory data,
            bool executed,
            uint numConfirmations
        );
}
