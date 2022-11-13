# GovernorTimelockControl

Extension of {Governor} that binds the execution process to an instance of {TimelockController}. This adds a delay, enforced by the {TimelockController} to all successful proposal (in addition to the voting duration). The {Governor} needs the proposer (and ideally the executor) roles for the {Governor} to work properly.

Using this model means the proposal will be operated by the {TimelockController} and not by the {Governor}. Thus, the assets and permissions must be attached to the {TimelockController}. Any asset sent to the {Governor} will be inaccessible.

WARNING: Setting up the TimelockController to have additional proposers besides the governor is very risky, as it grants them powers that they must be trusted or known not to use: 1) {onlyGovernance} functions like {relay} are available to them through the timelock, and 2) approved governance proposals can be blocked by them, effectively executing a Denial of Service attack. This risk will be mitigated in a future release.

# Governance

Core of the governance system, designed to be extended though various modules.
This contract is abstract and requires several function to be implemented in various modules:
- A counting module must implement {quorum}, {_quorumReached}, {_voteSucceeded} and {_countVote}
- A voting module must implement {_getVotes}
- Additionanly, the {votingPeriod} must also be implemented

# TimelockController

Contract module which acts as a timelocked controller. When set as the owner of an `Ownable` smart contract, it enforces a timelock on all `onlyOwner` maintenance operations. This gives time for users of the controlled contract to exit before a potentially dangerous maintenance operation is applied.

By default, this contract is self administered, meaning administration tasks have to go through the timelock process. The proposer (resp executor) role is in charge of proposing (resp executing) operations. A common use case is to position this {TimelockController} as the owner of a smart contract, with a multisig or a DAO as the sole proposer.

# ERC20Votes

Extension of ERC20 to support Compound-like voting and delegation. This version is more generic than Compound's, and supports token supply up to 2^224^ - 1, while COMP is limited to 2^96^ - 1.

If exact COMP compatibility is required, use the {ERC20VotesComp} variant of this module.

This extension keeps a history (checkpoints) of each account's vote power. Vote power can be delegated either by calling the {delegate} function directly, or by providing a signature to be used with {delegateBySig}. Voting power can be queried through the public accessors {getVotes} and {getPastVotes}.

By default, token balance does not account for voting power. This makes transfers cheaper. The downside is that it requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked.

# ERC20Permit
Implementation of the ERC20 Permit extension allowing approvals to be made via signatures, as defined in https://eips.ethereum.org/EIPS/eip-2612[EIP-2612].

Adds the {permit} method, which can be used to change an account's ERC20 allowance (see {IERC20-allowance}) by presenting a message signed by the account. By not relying on `{IERC20-approve}`, the token holder account doesn't need to send a transaction, and thus is not required to hold Ether at all.

