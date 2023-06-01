const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')

const constants = require('../../helpers/constants')
const addressesConfig = require(constants.PATH_TO_ADDRESSES_FOR_STABLECOIN_FOLDER)

const BOOK_KEEPER_ADDRESS =addressesConfig.BOOK_KEEPER_ADDRESS
const TO_BE_ALLOWLISTED = "0x2B3691065A78F5fb02E9BF54A197b95da2B26AF7"
const _encodeAllowlist = (toBeAllowlistedAddress) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'allowlist',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'toBeAllowlistedAddress'
        }]
    }, [toBeAllowlistedAddress]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeAllowlist(TO_BE_ALLOWLISTED),
        BOOK_KEEPER_ADDRESS,
        "setAllowlistedAddressBookkeeper"
    )
}

//TODO:

// function setTotalDebtCeiling(uint256 _totalDebtCeiling) external onlyOwner {
//     _requireLive();
//     totalDebtCeiling = _totalDebtCeiling;
//     emit LogSetTotalDebtCeiling(msg.sender, _totalDebtCeiling);
// }

// function setAccessControlConfig(address _accessControlConfig) external onlyOwner {
//     accessControlConfig = _accessControlConfig;
//     emit LogSetAccessControlConfig(msg.sender, _accessControlConfig);
// }

// function setCollateralPoolConfig(address _collateralPoolConfig) external onlyOwner {
//     collateralPoolConfig = _collateralPoolConfig;
//     emit LogSetCollateralPoolConfig(msg.sender, _collateralPoolConfig);
// }