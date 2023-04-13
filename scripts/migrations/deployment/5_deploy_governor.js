const TimelockController = artifacts.require('./dao/governance/TimelockController.sol');
const VMainToken = artifacts.require('./dao/tokens/VMainToken.sol');
const MainTokenGovernor = artifacts.require('./dao/governance/MainTokenGovernor.sol');
const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
 
const VMainToken_address = VMainToken.address;
const TimelockController_address = TimelockController.address;
const MultiSigWallet_address = MultiSigWallet.address;
const initialVotingDelay = 30;  //Approx. 2 days with one block every 2s
const votingPeriod = 450; //  approx. 5 days with one block every 2s -- (5 * 24 * 60 * 60) / 2,
const initialProposalThreshold = web3.utils.toWei('100000','ether'); // ~ $5000 at the launch
// below are in timestamp and not blocks
// Each user cannot make proposals if they have recently made a proposal, for a given time delay.
// This given delay is proposalTimeDelay, the time between multiple proposals for each user
const proposalTimeDelay = 60; // 1 day
// After the proposal is created, till what time period the proposal can be executed. 
// After the lifetime exceeds, the proposal can’t be executed.
const proposalLifetime = 60 * 86400; // 2months


module.exports =  async function(deployer) {
    let promises = [
        deployer.deploy(
            MainTokenGovernor,
            VMainToken_address,
            TimelockController_address,
            MultiSigWallet_address, 
            initialVotingDelay,
            votingPeriod,
            initialProposalThreshold,
            proposalTimeDelay,
            proposalLifetime,
            { gas: 12000000 }),
    ];

    await Promise.all(promises);
};

