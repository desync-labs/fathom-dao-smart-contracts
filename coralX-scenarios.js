module.exports = {
  deploySepolia: [
    ['execute', '--path', 'scripts/migrations/deployment', '--network', 'sepolia'],
    ['execute', '--path', 'scripts/migrations/setup', '--network', 'sepolia'],
    ['execute', '--path', 'scripts/migrations/prod', '--network', 'sepolia'],
    ['execute', '--path', 'scripts/migrations/save-address', '--network', 'sepolia']
  ],
  deployApothem: [
    ['execute', '--path', 'scripts/migrations/deployment', '--network', 'apothem'],
    ['execute', '--path', 'scripts/migrations/save-address/1_save_address_deployment.js', '--network', 'apothem'],
    ['execute', '--path', 'scripts/migrations/setup', '--network', 'apothem'],
    ['execute', '--path', 'scripts/migrations/save-address/2_save_address_setup.js', '--network', 'apothem'],
    ['execute', '--path', 'scripts/migrations/prod', '--network', 'apothem'],
    ['execute', '--path', 'scripts/migrations/save-address/3_save_address_prod.js', '--network', 'apothem']
  ],
  deployXDC: [
    ['execute', '--path', 'scripts/migrations/deployment', '--network', 'xdc'],
    ['execute', '--path', 'scripts/migrations/save-address/1_save_address_deployment.js', '--network', 'xdc'],
    ['execute', '--path', 'scripts/migrations/setup', '--network', 'xdc'],
    ['execute', '--path', 'scripts/migrations/save-address/2_save_address_setup.js', '--network', 'xdc'],
    ['execute', '--path', 'scripts/migrations/prod', '--network', 'xdc'],
    ['execute', '--path', 'scripts/migrations/save-address/3_save_address_prod.js', '--network', 'xdc']
  ],

  transferTokenFromMultisigApothem: [
    ['compile'],
    ['execute', '--path', 'scripts/units/transfer-tokens.js', '--network', 'apothem'],
  ],

  addOwnersToMultisigApothem: [
    ['compile'],
    ['execute', '--path', 'scripts/units/setup-multisig-owners.js', '--network', 'apothem'],
  ],

  addCouncilStakesApothem: [
    ['compile'],
    ['execute', '--path', 'scripts/units/setup_council_stakes.js', '--network', 'apothem'],
  ],

  createDexPoolApothem: [
    ['compile'],
    ['execute', '--path', 'scripts/units/create_pool_dex.js', '--network', 'apothem'],
  ],
  
  migrateAndConfigureForTests: [
    ['compile'],
    ['execute', '--path', 'scripts/migrations/deployment-test'],
    ['execute', '--path', 'scripts/migrations/test'],
    ['execute', '--path', 'scripts/migrations/upgrades'],
  ],
  
}
