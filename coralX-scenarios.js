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

  deployUpgradedStakingContractApothem: [
    ['execute', '--path', 'scripts/migrations/deploy-new-staking-package', '--network', 'apothem'],
  ],

  deployUpgradedStakingContractXDC: [
    ['execute', '--path', 'scripts/migrations/deploy-new-staking-package', '--network', 'xdc'],
  ],

  transferTokenFromMultisigApothem: [
    ['execute', '--path', 'scripts/units/transfer-tokens.js', '--network', 'apothem'],
  ],

  addOwnersToMultisigApothem: [
    ['execute', '--path', 'scripts/units/setup-multisig-owners.js', '--network', 'apothem'],
  ],

  addCouncilStakesApothem: [
    ['execute', '--path', 'scripts/units/setup_council_stakes.js', '--network', 'apothem'],
  ],

  createDexXDCPoolApothem: [
    ['execute', '--path', 'scripts/units/create_pool_dex_xdc.js', '--network', 'apothem'],
  ],

  createDexPoolApothem: [
    ['execute', '--path', 'scripts/units/create_pool_dex.js', '--network', 'apothem'],
  ],
  
  createProxyWalletApothem: [
    ['execute', '--path', 'scripts/units/create_stablecoin_proxy_wallet.js', '--network', 'apothem'],
  ],

  openPositionApothem: [
    ['execute', '--path', 'scripts/units/create_stablecoin_open_position.js', '--network', 'apothem'],
  ],

  createUpgradeApothem: [
    ['execute', '--path', 'scripts/units/create-upgrade.js', '--network', 'apothem'],
  ],

  setupStableSwapApothem: [
    ['execute', '--path', 'scripts/units/stableswap-setup.js', '--network', 'apothem'],
  ],

  deployStakingUpgradeApothem: [
    ['execute', '--path', 'scripts/upgrades/1_deploy_staking_upgrade.js', '--network', 'apothem'],
  ],

  updateDailySwapLimitApothem: [
    ['execute', '--path', 'scripts/units/stableswap-daily-limit-update.js', '--network', 'apothem'],
  ],

  updateMinTokenVotingBalance: [
    ['execute', '--path', 'scripts/units/update-voting-tokens-min-balance.js', '--network', 'apothem'],
  ],

  proposeProposalApothem: [
    ['execute', '--path', 'scripts/units/propose-proposal.js', '--network', 'apothem'],
  ],

  queueProposalApothem: [
    ['execute', '--path', 'scripts/units/queue-proposal.js', '--network', 'apothem'],
  ],

  executeProposalApothem: [
    ['execute', '--path', 'scripts/units/execute-proposal.js', '--network', 'apothem'],
  ],

  executeSwapTokensForExactETH: [
    ['execute', '--path', 'scripts/units/swap-Tokens-For-Exact-ETH.js', '--network', 'apothem'],
  ],

  executeSwapExactTokensForTokens: [
    ['execute', '--path', 'scripts/units/swap-Exact-Tokens-For-Tokens.js', '--network', 'apothem'],
  ],

  executeSwapExactETHForTokens: [
    ['execute', '--path', 'scripts/units/swap-Exact-ETH-For-Tokens.js', '--network', 'apothem'],
  ],

  addLiquidityToPool: [
    ['execute', '--path', 'scripts/units/add-liquidity-to-pool.js', '--network', 'apothem'],
  ],

  addLiquidityToXDCPool: [
    ['execute', '--path', 'scripts/units/add-liquidity-to-xdc-pool.js', '--network', 'apothem'],
  ],

  migrateAndConfigureForTests: [
    ['compile'],
    ['execute', '--path', 'scripts/migrations/deployment-test'],
    ['execute', '--path', 'scripts/migrations/test'],
    ['execute', '--path', 'scripts/migrations/upgrades'],
  ],
  
}
