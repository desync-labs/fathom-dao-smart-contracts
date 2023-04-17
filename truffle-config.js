module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    }
  },
  compilers: {
    solc: {
      version: "0.8.16",
      osettings: {
        optimizer: {
          enabled: true,
          details: { yul: false },
          runs: 150,
        },
        evmVersion: 'istanbul',
      },
    }
  }
};