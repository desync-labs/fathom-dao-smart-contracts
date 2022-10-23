module.exports = {
  deployGoerli: [
    ['execute', '--path', 'scripts/migrations/governance', '--network', 'goerli'],
    ['execute', '--path', 'scripts/migrations/staking', '--network', 'goerli'],
  ],
  deployApothem: [
    ['execute', '--path', 'scripts/migrations/governance', '--network', 'apothem'],
    ['execute', '--path', 'scripts/migrations/staking', '--network', 'apothem'],
  ],
  deployXDC: [
    ['execute', '--path', 'scripts/migrations/governance', '--network', 'xdc'],
    ['execute', '--path', 'scripts/migrations/staking', '--network', 'xdc'],
  ],
  migrateAndConfigureForTests: [
    ['compile'],
    ['execute', '--path', 'scripts/migrations/governance'],
    ['execute', '--path', 'scripts/migrations/staking'],
  ],
}
