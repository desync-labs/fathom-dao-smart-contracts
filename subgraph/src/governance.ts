import { BigInt } from "@graphprotocol/graph-ts";
import { ProposalCreated, VoteCast, VoteCastWithParams } from "../generated/Governor/Governor"
import { Proposal, GovernanceStat } from "../generated/schema";
import { Constants } from "./utils/constants"


enum VoteType {
    Against,
    For,
    Abstain
}

export function proposalCreatedHandler(event: ProposalCreated): void {
    // load ProtocolStat (create if first stake event)
    let governanceStat = GovernanceStat.load(Constants.GOVERNANCE)
    if (governanceStat == null) {
        governanceStat = new GovernanceStat(Constants.GOVERNANCE)
        governanceStat.totalProposalsCount = BigInt.fromString('0') 
    }
    // increment Total Proposals Count
    governanceStat.totalProposalsCount = governanceStat.totalProposalsCount.plus(BigInt.fromString('1'))
    governanceStat.save()

    let proposal = new Proposal(event.params.proposalId.toHexString())
    proposal.proposer = event.params.proposer;
    proposal.proposalId = event.params.proposalId;
    proposal.startBlock = event.params.startBlock;
    proposal.endBlock = event.params.endBlock;
    proposal.values = event.params.values;
    proposal.signatures = event.params.signatures;
    proposal.calldatas = event.params.calldatas;
    proposal.againstVotes = BigInt.fromString('0');
    proposal.forVotes = BigInt.fromString('0');
    proposal.abstainVotes = BigInt.fromString('0');
    proposal.description = event.params.description;
    proposal.blockNumber = event.block.number;
    proposal.blockTimestamp = event.block.timestamp;
    proposal.transaction = event.transaction.hash;

    proposal.targets = [];
    let targets: string[] = [];
    for (let i = 0;  i < event.params.targets.length; i++) {
        targets.push(event.params.targets[i].toHexString());
    }
    proposal.targets = targets;

    proposal.save()
}

export function voteCastHandler(event: VoteCast): void {
    voteCast(event.params.proposalId.toHexString(), event.params.support, event.params.weight);
}

export function voteCastWithParamsHandler(event: VoteCastWithParams): void {
    voteCast(event.params.proposalId.toHexString(), event.params.support, event.params.weight);
}

function voteCast(proposalId: string, support: number, weight: BigInt): void {
    let proposal = Proposal.load(proposalId)
    
    // increment vote type by weight
    if (proposal != null) {
        switch(u32(support)) {
            case VoteType.Against:
                proposal.againstVotes = proposal.againstVotes.plus(weight)
                break;
            case VoteType.For:
                proposal.forVotes = proposal.forVotes.plus(weight)
                break;
            case VoteType.Abstain:
                proposal.abstainVotes = proposal.abstainVotes.plus(weight)
                break;                
          }
        proposal.save()
    }
}

