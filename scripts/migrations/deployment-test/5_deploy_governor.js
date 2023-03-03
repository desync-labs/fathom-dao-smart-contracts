const TimelockController = artifacts.require('./dao/governance/TimelockController.sol');
const VMainToken = artifacts.require('./dao/tokens/VMainToken.sol');
const MainTokenGovernor = artifacts.require('./dao/governance/MainTokenGovernor.sol');
const MultiSigWallet = artifacts.require("./dao/treasury/MultiSigWallet.sol");
 
const VMainToken_address = VMainToken.address;
const TimelockController_address = TimelockController.address;
const MultiSigWallet_address = MultiSigWallet.address;
const initialVotingDelay = 1; 
const votingPeriod = 30; 
const initialProposalThreshold = web3.utils.toWei('1000','ether');
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

