const SUBMIT_TRANSACTION_EVENT = "SubmitTransaction(uint256,address,address,uint256,bytes)";
const EMPTY_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000';
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
// Update the PATH_TO_ADDRESSES based on the NODE_ENV environment variable
const env = process.env.NODE_ENV || 'dev';
const PATH_TO_ADDRESSES = `../../addresses.${env}.json`;
const PATH_TO_ADDRESSES_FOR_DEX_FOLDER = `../../../config/config.${env}`
const PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER = `../../../../config/config.${env}`
const PATH_TO_NEWLY_GENERATED_TRANSACTION_INDEX = `./config/newly-generated-transaction-index.${env}.json`;
const PATH_TO_ADDRESSES_FOR_STAKING_POSITION_FOLDER = `../../../addresses.staking-position.${env}.json`;

module.exports = {
    SUBMIT_TRANSACTION_EVENT,
    EMPTY_BYTES,
    PATH_TO_ADDRESSES,
    PATH_TO_NEWLY_GENERATED_TRANSACTION_INDEX,
    PATH_TO_ADDRESSES_FOR_DEX_FOLDER,
    PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER,
    PATH_TO_ADDRESSES_FOR_STAKING_POSITION_FOLDER,
    NULL_ADDRESS
}
