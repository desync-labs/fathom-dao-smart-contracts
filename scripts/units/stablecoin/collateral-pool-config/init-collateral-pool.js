const fs = require('fs');
const txnHelper = require('../../helpers/submitAndExecuteTransaction')
const rawdataExternal = fs.readFileSync('../../../../config/external-addresses.json');
const addressesExternal = JSON.parse(rawdataExternal);

const COLLATERAL_POOL_CONFIG_ADDRESS =addressesExternal.COLLATERAL_POOL_CONFIG_ADDRESS
const COLLATERAL_POOL_ID = ''
const DEBT_CEILING = ''
const DEBT_FLOOR = ''
const PRICE_FEED = ''
const LIQUIDATION_RATIO=''
const STABILITY_FEE_RATE=''
const ADAPTER = ''
const CLOSE_FACTOR_BPS = ''
const LIQUIDATOR_INCENTIVE_BPS = ''
const TREASURY_FEE_BPS = ''
const STRATEGY = ''
const _encodeInitCollateralPool = (_collateralPoolId,_debtCeiling,_debtFloor,_priceFeed,_liquidationRatio,_stabilityFeeRate,_adapter,_closeFactorBps,_liquidatorIncentiveBps,_treasuryFeesBps,_strategy) => {
    let toRet =  web3.eth.abi.encodeFunctionCall({
        name: 'initCollateralPool',
        type: 'function',
        inputs: [{
            type: 'bytes32',
            name: '_collateralPoolId'
        },{
            type: 'uint256',
            name: '_debtCeiling'
        },{
            type: 'uint256',
            name: '_debtFloor'
        },{
            type: 'address',
            name: '_priceFeed'
        },{
            type: 'uint256',
            name: '_liquidationRatio'
        },{
            type: 'uint256',
            name: '_stabilityFeeRate'
        },{
            type: 'address',
            name: '_adapter'
        },{
            type: 'uint256',
            name: '_closeFactorBps'
        },{
            type: 'uint256',
            name: '_liquidatorIncentiveBps'
        },{
            type: 'uint256',
            name: '_treasuryFeesBps'
        },{
            type: 'address',
            name: '_strategy'
        }]
    }, [_collateralPoolId,_debtCeiling,_debtFloor,_priceFeed,_liquidationRatio,_stabilityFeeRate,_adapter,_closeFactorBps,_liquidatorIncentiveBps,_treasuryFeesBps,_strategy]);

    return toRet;
}


module.exports = async function(deployer) {

    await txnHelper.submitAndExecute(
        _encodeInitCollateralPool(
            COLLATERAL_POOL_ID,
            DEBT_CEILING,
            DEBT_FLOOR,
            PRICE_FEED,
            LIQUIDATION_RATIO,
            STABILITY_FEE_RATE,
            ADAPTER,
            CLOSE_FACTOR_BPS,
            LIQUIDATOR_INCENTIVE_BPS,
            TREASURY_FEE_BPS,
            STRATEGY),
            
        COLLATERAL_POOL_CONFIG_ADDRESS,
        "collateralInitPool"
    )
}