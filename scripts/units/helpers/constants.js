const SUBMIT_TRANSACTION_EVENT = "SubmitTransaction(uint256,address,address,uint256,bytes)";
const EMPTY_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000';

// Update the PATH_TO_ADDRESSES based on the NODE_ENV environment variable
const env = process.env.NODE_ENV || 'dev';
const PATH_TO_ADDRESSES = `../../addresses.${env}.json`;

const PATH_TO_NEWLY_GENERATED_TRANSACTION_INDEX = `./config/newly-generated-transaction-index.${env}.json`;

module.exports = {
    SUBMIT_TRANSACTION_EVENT,
    EMPTY_BYTES,
    PATH_TO_ADDRESSES,
    PATH_TO_NEWLY_GENERATED_TRANSACTION_INDEX
}
