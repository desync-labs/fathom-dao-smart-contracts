# Scenarios Instruction

## Table of contents

- [Scenarios Instructions](#scenarios-instructions)
    - [How if file Structure](#How-is-file-Structured)
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

## How is file Structured?


In config/external-addresses.json file all the addresses are stored that needs to be used externally

In config/newly-generated-transaction-index.json file all the newly generated transaction indexes are stored. Note: It would be a good practise to make this file empty for each new deployment you do and each new deployment in another branch.

config/external-addresses.json, config/newly-generated-transaction-index.json, stablecoin-addresses-proxy-wallet.json should not be deleted or the scenarios wont work



## How to Setup Council Stakes
**//Note: This is only possible once as theres initializer for council stakes.**

In file in scripts/units/setup_council_stakes.js

1. Hardcode COUNCIL_1, COUNCIL_2, COUNCIL_3
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
1. In scripts/units/setup-multisig-owners.js Hardcode the COUNCIL_1 and COUNCIL_2
2. coralX scenario --run addOwnersToMultisigApothem

## How to create dex pool with Native Token
1. In scripts/units/create_pool_dex_xdc.js Hardcode the followings:
* TOKEN_ADDRESS 
*    AMOUNT_TOKEN_DESIRED
*    AMOUNT_TOKEN_MIN
*    AMOUNT_ETH_MIN
*    DEX_ROUTER_ADDRESS //this comes from external address
*    TOKEN_ETH

2. coralX scenario --run createDexXDCPoolApothem

## How to create dex pool with Two tokens
1. In scripts/units/create_pool_dex.js Hardcode the followings:
* Token_A_Address
* Token_B_Address
* Amount_A_Desired 
* Amount_B_Desired
* Amount_A_Minimum
* Amount_B_Minimum
* const DEX_ROUTER_ADDRESS //this comes from external address

2. coralX scenario --run createDexXDCPoolApothem

## How to create Proxy Wallet
#### Note (VIMP): This can be called only once for any address. So, if I call once from multisig, it will create a proxy wallet whose address is stored in 'config/stablecoin-addresses-proxy-wallet.json'. This address is then used to create positions and this address never changes for a particular Multisig or EOA.

1. PROXY_WALLET_REGISTRY_ADDRESS will be taken from external addresses
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
