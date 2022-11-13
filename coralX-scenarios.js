module.exports = {
  deploySepolia: [
    ['execute', '--path', 'scripts/migrations/deployment', '--network', 'sepolia'],
    ['execute', '--path', 'scripts/migrations/setup', '--network', 'sepolia'],
    ['execute', '--path', 'scripts/migrations/prod', '--network', 'sepolia'],
  ],
  deployApothem: [
    ['execute', '--path', 'scripts/migrations/deployment', '--network', 'apothem'],
    ['execute', '--path', 'scripts/migrations/setup', '--network', 'apothem'],
    ['execute', '--path', 'scripts/migrations/prod', '--network', 'apothem'],
  ],
  deployXDC: [
    ['execute', '--path', 'scripts/migrations/deployment', '--network', 'xdc'],
    ['execute', '--path', 'scripts/migrations/setup', '--network', 'xdc'],
    ['execute', '--path', 'scripts/migrations/prod', '--network', 'xdc'],
  ],
  migrateAndConfigureForTests: [
    ['compile'],
    ['execute', '--path', 'scripts/migrations/deployment'],
    ['execute', '--path', 'scripts/migrations/setup'],
    ['execute', '--path', 'scripts/migrations/test'],
  ],
  createStablecoinPool: [
    ['execute', '--path', 'scripts/stablecoin-integration/create-pool-through-governance.js']
  ],
}
