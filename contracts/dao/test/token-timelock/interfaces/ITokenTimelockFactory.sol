// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

interface ITokenTimelockFactory {
    function deployTokenTimelocks(address[] calldata beneficiaries, uint256[] calldata releaseTimes) external returns (address[] memory);
}
