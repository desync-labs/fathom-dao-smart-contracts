const fs = require('fs');
const path = require('path');

const configDir = path.join(path.resolve(), 'config');
const configPath = path.join(configDir, 'config.prod.js')

if (fs.existsSync(configPath)) {
    console.log(`config.prod.js file already exists in ${configDir} directory!`);
}
else 
{
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
    }

    const constants = `module.exports = {
        POSITION_MANAGER_ADDRESS: "",
        STABILITY_FEE_COLLECTOR_ADDRESS: "",
        COLLATERAL_TOKEN_ADAPTER_ADDRESS: "",
        STABLE_COIN_ADAPTER_ADDRESS: "",
        collateralPoolId: "",
        DEX_ROUTER_ADDRESS: "",
        PROXY_WALLET_REGISTRY_ADDRESS: "",
        STABLE_SWAP_ADDRESS: "",
        USD_ADDRESS: "",
        FXD_ADDRESS: "",
        SHOW_STOPPER_ADDRESS: "",
        SYSTEM_DEBT_ENGINE_ADDRESS: "",
        STABILIITY_FEE_COLLECTOR_ADDRESS: "",
        PRICE_ORACLE_ADDRESS: "",
        BOOK_KEEPER_ADDRESS: "",
        POSITION_MANAGER_ADDRESS: "",
        COLLATERAL_POOL_CONFIG_ADDRESS: "",
        DEX_FACTORY_ADDRESS: "",
        WETH_ADDRESS: "",
        STABLE_SWAP_WRAPPER_ADDRESS:"",
        STAKING_ADDRESS:"",
        VAULT_ADDRESS:"",
        COUNCIL_1:"",
        COUNCIL_2:"",
        COUNCIL_3:""
    };`;

    fs.writeFile(configPath, constants, (err) => {
        if (err) throw err;
        console.log(`config.prod.js file has been created in ${configDir} directory!`);
    });
}
