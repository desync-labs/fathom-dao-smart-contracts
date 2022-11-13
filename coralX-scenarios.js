module.exports = {
  deploySepolia: [
    ['execute', '--path', 'scripts/migrations/setup', '--network', 'sepolia'],
  ],
  deployApothem: [
    ['execute', '--path', 'scripts/migrations/setup', '--network', 'apothem'],
  ],
  deployXDC: [
    ['execute', '--path', 'scripts/migrations/setup', '--network', 'xdc'],
  ],
  migrateAndConfigureForTests: [
    ['compile'],
    ['execute', '--path', 'scripts/migrations/setup/'],
    ['execute', '--path', 'scripts/migrations/tests/test'],
  ],
  createStablecoinPool: [
    ['execute', '--path', 'scripts/stablecoin-integration/create-pool-through-governance.js']
  ],
}
