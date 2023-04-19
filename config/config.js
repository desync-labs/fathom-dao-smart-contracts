function loadConfig(filePath){
    try {
        return require(filePath);
        } catch (error) {
        console.warn(`${filePath} not found. Defaulting to an empty configuration.`);
        return {};
    }
}

const configPaths = {
    dev: './config.dev',
    demo: './config.demo',
    prod: './config.prod',
  };
  
const env = process.env.NODE_ENV;
const configFilePath = configPaths[env] || configPaths['dev'];
const config = loadConfig(configFilePath);
module.exports = config;