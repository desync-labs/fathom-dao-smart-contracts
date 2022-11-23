module.exports = {
  deploySepolia: [
    ['execute', '--path', 'scripts/migrations/deployment', '--network', 'sepolia'],
    ['execute', '--path', 'scripts/migrations/setup', '--network', 'sepolia'],
    ['execute', '--path', 'scripts/migrations/prod', '--network', 'sepolia'],
    ['execute', '--path', 'scripts/migrations/save-address', '--network', 'sepolia']
  ],
  deployApothem: [
    ['execute', '--path', 'scripts/migrations/deployment', '--network', 'apothem'],
    ['execute', '--path', 'scripts/migrations/setup', '--network', 'apothem'],
    ['execute', '--path', 'scripts/migrations/prod', '--network', 'apothem'],
    ['execute', '--path', 'scripts/migrations/save-address', '--network', 'apothem']
  ],
  deployXDC: [
    ['execute', '--path', 'scripts/migrations/deployment', '--network', 'xdc'],
    ['execute', '--path', 'scripts/migrations/setup', '--network', 'xdc'],
    ['execute', '--path', 'scripts/migrations/prod', '--network', 'xdc'],
    ['execute', '--path', 'scripts/migrations/save-address', '--network', 'xdc']
  ],
  migrateAndConfigureForTests: [
    ['compile'],
    ['execute', '--path', 'scripts/migrations/deployment'],
    ['execute', '--path', 'scripts/migrations/setup'],
    ['execute', '--path', 'scripts/migrations/test'],
    ['execute', '--path', 'scripts/migrations/upgrades'],
    ['execute', '--path', 'scripts/migrations/save-address'],
  ],
  createStablecoinPool: [
    ['execute', '--path', 'scripts/stablecoin-integration/create-pool-through-governance.js']
  ],
}
