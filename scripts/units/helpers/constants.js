const SUBMIT_TRANSACTION_EVENT = "SubmitTransaction(uint256,address,address,uint256,bytes)";
const EMPTY_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000';
const PATH_TO_ADDRESSES= '../../addresses.json'
const PATH_TO_ADDRESSES_EXTERNAL = '../../config/external-addresses.json'
const PATH_TO_NEWLY_GENERATED_TRANSACTION_INDEX = './config/newly-generated-transaction-index.json'

module.exports = {
    SUBMIT_TRANSACTION_EVENT,
    EMPTY_BYTES,
    PATH_TO_ADDRESSES,
    PATH_TO_ADDRESSES_EXTERNAL,
    PATH_TO_NEWLY_GENERATED_TRANSACTION_INDEX
}
