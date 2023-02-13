const blockchain = require("../tests/helpers/blockchain");
const eventsHelper = require("../tests/helpers/eventsHelper");
const { assert } = require("chai");
// const BigNumber = require("bignumber.js");

const { BigNumber } = require("ethers");
const { formatBytes32String } = require("ethers/lib/utils");

// Proposal 1
const PROPOSAL_DESCRIPTION = "Proposal #3: Init stablecoin collateral pool";
const NEW_STORE_VALUE = "5";

// Events
const PROPOSAL_CREATED_EVENT = "ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)"
const SUBMIT_TRANSACTION_EVENT = "SubmitTransaction(uint256,address,address,uint256,bytes)";

// Token variables
const T_TOKEN_TO_TRANSFER = "100000000000000000000000";
const T_TO_STAKE = web3.utils.toWei('2000', 'ether');
const STAKED_MIN = web3.utils.toWei('1900', 'ether');

const SYSTEM_ACC = accounts[0];
const stream_owner = accounts[3];
const STAKER_1 = accounts[5];
const STAKER_2 = accounts[6];
const NOT_STAKER = accounts[7];

const _getTimeStamp = async () => {
    const timestamp = await blockchain.getLatestBlockTimestamp()
    return timestamp
}

// Collateral pool setup
const colPoolConfigAddress = "0x26B38db6A03E8c46611a9E4Cf61B2FeC5494FaFf";

//this is used for stream shares calculation.
const vMainTokenCoefficient = 500;

let mainTokenGovernor;
let box;
let proposalId;
let result;
let encoded_function;
let description_hash;

// initCollateralPool parameters

// Need to fetch this from latest deployment from 
const rawdata = '{"accessControlConfig":"0xa3B5e3c691C83b8440A38B80B451099c0da63574","collateralPoolConfig":"0x26B38db6A03E8c46611a9E4Cf61B2FeC5494FaFf","bookKeeper":"0x49Abc711f65d7E139B10D43F503BC9CDf829e5f0","fathomStablecoin":"0xfF1aD272c80444511444eAeD3AB1C4589AaDf86F","systemDebtEngine":"0x1d7571a073e0eB76222A38A643d192fA62EeB501","liquidationEngine":"0xE8ad10b5D603A696A77013aa1B9620D8De95d5f7","stablecoinAdapter":"0xCe77cb08d3f0C7C44d67e65966dB3a66d08cdcb9","priceOracle":"0x56DA731F3B4D5496109a5724aF20A5fa1e161Dd1","showStopper":"0x74DD97d7313947205Ac33e2C16172603BD9e91F5","fathomToken":"0x0ebE93530C27aD39516834AcCEf1be62c9f557E2","fairLaunch":"0x67a42C587d5b2aE6e91784EB91e4bB9428ffB8AA","WXDC":"0xAAcb1c4A83056d99357f9e93Ef50FB3cd05d6a2d","USDT":"0x9Ed0Ff4f44A233f6abBD6b2187c8fc34A2d74fC7","DNM":"0xeA8aA20dB7ce3Dd0D8C318207f1D96102d45A8c1","shield":"0x1cA13cF1aB59944A329599f17593297aA372f15b","positionManager":"0x801eEB237a2364A38f2c9B82C0CD54cc5Bf5abA8","collateralTokenAdapter":"0x136e516984dC410F76EA32F8a18245191F683D60","simplePriceFeed":"0x149155B9cAd53847CC7cdEB4D6FED88ff6f31761","simplePriceFeedUSDT":"0xd72E7b17435520d7CcBf5336e0BaEf5E94b317DB","simplePriceFeedUSDTCOL":"0xE33d3fffe00F78BA3bEf3BDB39aBAAB7CAD1FbD2","simplePriceFeedFTHM":"0xCBD10516685B0d91914543DBb189e4dDd864cDAb","fixedSpreadLiquidationStrategy":"0x17d186B5B7724cE901cC6792D23626ED6530b760","fathomStablecoinProxyActions":"0xaA70aD720f130e57d4bD80517e57A441f5F21E12","stabilityFeeCollector":"0x739e916d40864d6eB09F1943A510Cb2657E223fb","proxyWalletFactory":"0x86504933bb9d24Ea2fECA6679836BBC07570b08D","proxyWalletRegistry":"0x335bEBc68b1d249E0Db8E20990255b2Ff985CdDf","authTokenAdapter":"0x046883899EBE0A9f6a8FA3982ca5C421B39CF9EE","stableSwapModule":"0x931aC07e0f9CA2c477DB45Eb870D7EF7e823ee82","getPositions":"0xD3974Fd03F98cABcCE0a120FD02599C736480650","collateralTokenAdapterUSDT":"0xe45C2c97d9FB27d89B8f9d7BF9568E4CBC73a151","collateralTokenAdapterFTHM":"0xbf7599eA133BC24f84897599364801e344bB7E81","collateralTokenAdapterUSDTCOL":"0xdD057bf9B343b41E3ABd625959E63c8Ccc23C679","collateralTokenAdapterDNM":"0xEeA2a5Fc00F128E4F46db2dCB4183f4638D9e93E"}'
let stablecoinAddress = JSON.parse(rawdata);


// const WeiPerWad = BigNumber.from(`1${"0".repeat(18)}`)
// const WeiPerRay = BigNumber.from(`1${"0".repeat(27)}`)
// const WeiPerRad = BigNumber.from(`1${"0".repeat(45)}`)

const WeiPerWad = `1${"0".repeat(18)}`
const WeiPerRay = `1${"0".repeat(27)}`
const WeiPerRad = `1${"0".repeat(45)}`
const COLLATERAL_POOL_ID = formatBytes32String("DNM");
const CLOSE_FACTOR_BPS = 5000
const LIQUIDATOR_INCENTIVE_BPS = 10500
const TREASURY_FEE_BPS = 5000

params = [
    COLLATERAL_POOL_ID,
    0,
    0, 
    stablecoinAddress.simplePriceFeedUSDT, 
    WeiPerRay,  
    WeiPerRay,  
    stablecoinAddress.collateralTokenAdapterDNM,  
    CLOSE_FACTOR_BPS*2,   
    LIQUIDATOR_INCENTIVE_BPS,  
    TREASURY_FEE_BPS,  
    stablecoinAddress.fixedSpreadLiquidationStrategy
]  

encoded_function = web3.eth.abi.encodeFunctionCall({
    name: 'initCollateralPool',
    type: 'function',
    inputs: [{
            type: 'bytes32',
            name:  '_collateralPoolId'
        },{
            type: 'uint256',
            name:  '_debtCeiling'
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
    }, params 
);



const CollateralPoolConfig = artifacts.require('./8.17/stablecoin-core/config/CollateralPoolConfig.sol');

module.exports = async function(deployer) {


  const mainTokenGovernor = await CollateralPoolConfig.at(stablecoinAddress.collateralPoolConfig);

    // create a proposal in MainToken governor
    result = await mainTokenGovernor.propose(
        [stablecoinAddress.collateralTokenAdapter],
        [0],
        [encoded_function],
        PROPOSAL_DESCRIPTION,
        {"from": STAKER_1}
    );
    // retrieve the proposal id
    proposalId = eventsHelper.getIndexedEventArgs(result, PROPOSAL_CREATED_EVENT)[0];    
// });

// it('Check that the proposal status is: Pending', async() => {
//     expect((await mainTokenGovernor.state(proposalId)).toString()).to.equal("0");
// })

// it('Wait two blocks and then check that the proposal status is: Active', async() => {

    let currentNumber = await web3.eth.getBlockNumber();
    let block = await web3.eth.getBlock(currentNumber);
    let timestamp = block.timestamp;
    
    var nextBlock = 1;    
    while (nextBlock <= 30) {   
        await blockchain.mineBlock(timestamp + nextBlock);    
        nextBlock++;              
    }
    // Check that the proposal is open for voting
    // expect((await mainTokenGovernor.state(proposalId)).toString()).to.equal("1");
// });

// it('Vote on the proposal', async() => {

    // enum VoteType {
    //     Against,
    //     For,
    //     Abstain
    // }
    // =>  0 = Against, 1 = For, 2 = Abstain 

    currentNumber = await web3.eth.getBlockNumber();
    block = await web3.eth.getBlock(currentNumber);
    timestamp = block.timestamp;
    
    nextBlock = 1;
    while (nextBlock <= 30) {   
        await blockchain.mineBlock(timestamp + nextBlock);    
        nextBlock++;              
    }
    // Vote:
    await mainTokenGovernor.castVote(proposalId, "1", {"from": STAKER_1});
// });


// it('Wait 40 blocks and then check that the proposal status is: Succeeded', async() => {
    currentNumber = await web3.eth.getBlockNumber();
    block = await web3.eth.getBlock(currentNumber);
    timestamp = block.timestamp;
    
    nextBlock = 1;
    while (nextBlock <= 450) {   
        await blockchain.mineBlock(timestamp + nextBlock);
        nextBlock++;              
    }

    // expect((await mainTokenGovernor.state(proposalId)).toString()).to.equal("4");
// });

// it('Queue the proposal', async() => {

    // Functions mainTokenGovernor.propose and mainTokenGovernor.queue have the same input, except for the
    //      description parameter, which we need to hash.
    //
    // A proposal can only be executed if the proposalId is the same as the one stored 
    //      in the governer contract that has passed a vote.
    // In the Governor.sol contract, the proposalId is created using all information used 
    //      in to create the proposal:
    // uint256 proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));

    result = await mainTokenGovernor.queue(      
        [stablecoinAddress.collateralTokenAdapter],
        [0],
        [encoded_function],
        description_hash,
        {"from": accounts[0]}
    );            
// });

// it('Approve the proposal from accounts 0 AND 1', async() => {

    await mainTokenGovernor.confirmProposal(proposalId, {"from": accounts[0]});
    await mainTokenGovernor.confirmProposal(proposalId, {"from": accounts[1]});
// });

// it('Wait 40 blocks and then check that the proposal status is: Queued', async() => {

    currentNumber = await web3.eth.getBlockNumber();
    block = await web3.eth.getBlock(currentNumber);
    timestamp = block.timestamp;
    
    nextBlock = 1;
    while (nextBlock <= 450) { 
        await blockchain.mineBlock(timestamp + nextBlock);
        nextBlock++;
    }
    // expect((await mainTokenGovernor.state(proposalId)).toString()).to.equal("5");
// });

// it('Execute the proposal', async() => {

    result = await mainTokenGovernor.execute(
        [stablecoinAddress.collateralTokenAdapter],
        [0],
        [encoded_function],
        description_hash,
        {"from": accounts[0]}
    );

    console.log(result);

};


// it('Should retrieve the updated value proposed by governance for the new store value in box.sol', async() => {

//     const new_val = await box.retrieve();

//     // Test if the returned value is the new value
//     expect((await box.retrieve()).toString()).to.equal(NEW_STORE_VALUE);
// });

