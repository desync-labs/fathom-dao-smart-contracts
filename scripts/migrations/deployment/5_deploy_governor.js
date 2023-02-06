const TimelockController = artifacts.require('./dao/governance/TimelockController.sol');
const VMainToken = artifacts.require('./dao/tokens/VMainToken.sol');
const MainTokenGovernor = artifacts.require('./dao/governance/MainTokenGovernor.sol');
const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
 
const VMainToken_address = VMainToken.address;
const TimelockController_address = TimelockController.address;
const MultiSigWallet_address = MultiSigWallet.address;
const initialVotingDelay = 30; 
const votingPeriod = 450; 
const initialProposalThreshold = 1000;
const proposalTimeDelay = 5;
const proposalLifetime = 86400;


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

