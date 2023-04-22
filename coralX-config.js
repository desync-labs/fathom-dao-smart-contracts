const fs = require("fs");
const path = require("path");
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  networks: {
    development: {
      host: "http://127.0.0.1:8545",
      private_key: fs.readFileSync("./privateKey").toString(),
      gasPrice: '0x3b9aca00',
    },
    sepolia: {
      host: "https://sepolia.infura.io/v3/99c6910d87a34c688c79342177d37bbe",
      private_key: fs.readFileSync("./privateKey").toString(),
      gasPrice: '0x3b9aca00',
    },
    apothem: {
      host: "https://arpc.apothem.network",
      private_key: fs.readFileSync("./privateKey").toString(),
      gasPrice: '0x3b9aca00',
    },
    xdc: {
      host: "https://erpc.xinfin.network",
      private_key: fs.readFileSync("./privateKey").toString(),
      gasPrice: '0x3b9aca00',
    },
    fromEnv: {
      host: process.env.ETH_HOST, // export ETH_HOST=...
      private_key: process.env.ETH_PK, // export ETH_PK=...
      gasPrice: process.env.GAS_PRICE, // export GAS_PRICE=...
    },
  },
  compilers: {
    solc: {
      version: 'native',
      settings: {
        optimizer: {
          enabled: true,
          details: { yul: false },
          runs: 150,
        },
        evmVersion: 'istanbul',
      },
    },
  },
  scenarios: require('./coralX-scenarios'),
  testsDir: path.join("scripts", "tests"),
}