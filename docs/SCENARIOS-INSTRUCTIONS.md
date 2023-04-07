# Scenarios Instruction

## Table of contents

- [Scenarios Instructions](#scenarios-instructions)
    - [How to setup at first](#How-to-setup-at-first)
    - [How is file Structure](#How-is-file-Structured)
    - [How to Setup Council Stakes](#How-to-Setup-Council-Stakes)
    - [How to transfer tokens](#How-to-transfer-tokens)
    - [How to Add Owners](#How-to-Add-owners)
    - [How to create dex pool with Native Token](#How-to-create-dex-pool-with-Native-Token)
    - [How to create dex pool with Two tokens](#How-to-create-dex-pool-with-Two-tokens)
    - [How to create Proxy Wallet](#How-to-create-Proxy-Wallet)
    - [How to Open Position](#How-to-Open-Position)
    - [How to propose a proposal](#How-to-propose-a-proposal)
    - [Queue Proposal](#Queue-Proposal)
    - [Execute Proposal](#Execute-Proposal)

## How to setup at first:
1. First you need to have addresses.json file in your root folder. This is automatically setup while doing deployment.
2. A config folder needs to be created at root folder. To do this simply run the command:

```
node scripts/units/helpers/create-config.js
```
And after creating config.js just fill it with required addresses

So basically you need to end up with config/config.js file path in your root folder for the scripts to work

Please be aware that each unit scripts need adjustment as per need and must be checked before performing execution

## How is file Structured?
In config/config.js file all the addresses are stored that needs to be used externally

In config/newly-generated-transaction-index.json file all the newly generated transaction indexes are stored.


## How to Setup Council Stakes
**//Note: This is only possible once as theres initializer for council stakes.**

In file in scripts/units/setup_council_stakes.js

1. The councils need to be updated in the config.js file
2. Hardcode T_TO_STAKE: Lock position for each council
3. Hardcode T_TOTAL_TO_APPROVE: Total to approve. Should be T_TO_STAKE * Number of councils
4. coralX scenario –run addCouncilStakesApothem

## How to transfer tokens
In this file scripts/units/transfer-tokens.js
Hardcode:
1. T_TO_TRANSFER_PLACEHOLDER
2. TRANSFER_TO_ACCOUNT_PLACEHOLDER
3. coralX scenario --run transferTokenFromMultisigApothem


## How to Add owners
1. In scripts/units/setup-multisig-owners.js 
2. COUNCIL_2 and COUNCIL_3 are from config.js
3. coralX scenario --run addOwnersToMultisigApothem

## How to create dex pool with Native Token
1. In scripts/units/create_pool_dex_xdc.js Hardcode the followings:
*    TOKEN_ADDRESS 
*    AMOUNT_TOKEN_DESIRED
*    AMOUNT_TOKEN_MIN
*    AMOUNT_TOKEN_ETH
*    AMOUNT_ETH_MIN
*    DEX_ROUTER_ADDRESS //this comes from config.js

2. coralX scenario --run createDexXDCPoolApothem

## How to create dex pool with Two tokens
1. In scripts/units/create_pool_dex.js Hardcode the followings:
* Token_A_Address
* Token_B_Address
* Amount_A_Desired 
* Amount_B_Desired
* Amount_A_Minimum
* Amount_B_Minimum
* const DEX_ROUTER_ADDRESS //this comes from config.js

2. coralX scenario --run createDexXDCPoolApothem

## How to create Proxy Wallet
#### Note (VIMP): This can be called only once for any address. 

The file : create_stablecoin_proxy_wallet.js

Calling from multisig, will create a proxy wallet whose address will be stored in newly created 'config/stablecoin-addresses-proxy-wallet.json'. This address is then used to create positions and this address never changes for a particular Multisig or EOA.

1. PROXY_WALLET_REGISTRY_ADDRESS will be taken from config.js
2. coralX scenario --run createProxyWalletApothem

## How to Open Position
1. In the file create_stablecoin_open_position.js hardcode:
* XDC_COL //how much collateral to give
* stablecoinAmount //stablecoin amount you want to receive
* data //data you want to pass

## How to propose a proposal
1. In the file propose-proposal.js Hardcode these:
* What are the targets to propose to
    const TARGETS = []
* What are the values that each target interaction needs. (msg.value for each transaction)
    const VALUES = []
* Calldatas: The function you want to call should be encoded
* Description
    const DESCRIPTION_HASH = ''
    
2. coralX scenario --run proposeProposalApothem

## Queue Proposal
1. In the file queue-proposal.js Hardcode these:
* What are the targets to queue to
    const TARGETS = []
* What are the values that each target interaction needs. (msg.value for each transaction)
    const VALUES = []
* Calldatas: The function you want to call should be encoded
* Description
    const DESCRIPTION_HASH = ''//this is bytes32
    
2. coralX scenario --run queueProposalApothem

## Execute Proposal

1. In the file execute-proposal.js Hardcode these:
* What are the targets to execute to
    const TARGETS = []
* What are the values that each target interaction needs. (msg.value for each transaction)
    const VALUES = []
* Calldatas: The function you want to call should be encoded
* Description
    const DESCRIPTION_HASH = ''//this is bytes32
    
2. coralX scenario --run proposeProposalApothem

Note: There are other scripts as well.
Note: This script can be made that it only submits a transaction and not really execute it. But for that some changes will be required in submitAndExecuteTransaction.js file.

Where in the function _submitAndExecute

    await multiSigWallet.executeTransaction(tx, {gas: 8000000});
    
And then the transaction index saved must be remembered for other owners to sign it if needed.
