# Fathom DAO Smart Contracts

Fathom project staking, governance and treasury smart contracts for EVM compatible chains.
[Protocol description](./docs/PROTOCOL.md)

## Package version requirements for your machine:

- node v16.4.0
- npm v7.18.1
- CoralX v0.2.0
- Solidity =0.8.16 (solc)
- Ganache CLI v6.12.2 (ganache-core: 2.13.2)

## Setup

The smart contracts are written in [Solidity](https://github.com/ethereum/solidity) and tested/deployed using [CoralX](https://github.com/Securrency-OSS/CoralX).

```bash
# Install nodejs:
$ sudo apt install nodejs

# Install npm:
$ sudo apt install npm

# Intall CoralX from the Securrency private registry
# Install CoralX package globally:
$ npm install -g coral-x

# Install ganache-cli:
$ npm install -g ganache-cli

# Install local node dependencies:
$ npm install

# Install Solc (https://docs.soliditylang.org/en/v0.8.13/installing-solidity.html)
$ curl -o /usr/bin/solc -fL https://github.com/ethereum/solidity/releases/download/v0.8.13/solc-static-linux \
    && chmod u+x /usr/bin/solc

# Create file with "privateKey" private key in the root direcory (use this only for tests):
$ echo -n PRIVATE_KEY > privateKey

# Run ganache with predefined accounts:
$ ganache-cli -m MNEMONIC --gasLimit 12500000

# now you can run tests:
$ npm run test

# Deploy to the local node
$ npm run migrate-reset

# Before Deployment - execute following scripts
# For Dev Environment
$ node scripts/units/helpers/create-config-dev.js
# For DEMO Environment
$ node scripts/units/helpers/create-config-demo.js
# For PROD Environment
$ node scripts/units/helpers/create-config-prod.js

# Deploy to the public testnet
# For a deployment to the public testnet make sure that you have testnet coins
# Deploy to the apothem - dev environment
$ npm run migrate-reset-apothem-dev

# Deploy to the apothem - demo environment
$ npm run migrate-reset-apothem-demo

# Deploy to the xdc - prod environment
$ npm run migrate-reset-xdc


# Deploy to the sepolia
$ npm run migrate-reset-sepolia

# Deploy to the xdc
$ npm run migrate-reset-xdc
```
