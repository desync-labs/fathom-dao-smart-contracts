const TimelockController = artifacts.require('./dao/governance/TimelockController.sol');
const VMainToken = artifacts.require('./dao/tokens/VMainToken.sol');
const MainTokenGovernor = artifacts.require('./dao/governance/MainTokenGovernor.sol');
const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
 
const VMainToken_address = VMainToken.address;
const TimelockController_address = TimelockController.address;
const MultiSigWallet_address = MultiSigWallet.address;
const initialVotingDelay = 86400;  //Approx. 2 days with one block every 2s
const votingPeriod = 216000; // (5 * 24 * 60 * 60) / 2, approx. 5 days with one block every 2s
const initialProposalThreshold = 1000; 
// time delay is in timestamp not block.
// Each user cannot make proposals if they have recently made a proposal, for a given time delay.
// This given delay is proposalTimeDelay, the time between multiple proposals for each user
const proposalTimeDelay = 86400;
// After the proposal is created, till what time period the proposal can be executed. 
// After the lifetime exceeds, the proposal can’t be executed.
const proposalLifetime = 14 * 86400;


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

