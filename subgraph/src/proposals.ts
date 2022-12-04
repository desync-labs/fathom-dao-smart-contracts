import { BigInt } from "@graphprotocol/graph-ts";
import {ProposalCreated, VoteCast, VoteCastWithParams} from "../generated/Governor/Governor"
import { Proposal } from "../generated/schema";

enum VoteType {
    Against,
    For,
    Abstain
}

export function proposalCreatedHandler(event: ProposalCreated): void {
    let proposal = new Proposal(event.params.proposalId.toHexString())
    proposal.proposer = event.params.proposer;
    proposal.proposalId = event.params.proposalId;
    proposal.startBlock = event.params.startBlock;
    proposal.endBlock = event.params.endBlock;
    proposal.description = event.params.description;
    // proposal.targets = []
    // for (let i = 0; i < event.params.targets.length; ++i) {
    //     proposal.targets.push(event.params.targets[i])
    // }
    // proposal.targets = event.params.targets;
    proposal.values = event.params.values;
    proposal.signatures = event.params.signatures;
    proposal.calldatas = event.params.calldatas;
    proposal.againstVotes = BigInt.fromString('0');
    proposal.forVotes = BigInt.fromString('0');
    proposal.abstainVotes = BigInt.fromString('0');
    proposal.save()
}

export function voteCastHandler(event: VoteCast): void {
    voteCast(event.params.proposalId.toHexString(), event.params.support);
}

export function voteCastWithParamsHandler(event: VoteCastWithParams): void {
    voteCast(event.params.proposalId.toHexString(), event.params.support);
}

function voteCast(proposalId: string, support: number): void {
    let proposal = Proposal.load(proposalId)
    
    if (proposal != null) {
        switch(u32(support)) {
            case VoteType.Against:
                proposal.againstVotes = proposal.againstVotes.plus(BigInt.fromString('1'))
                break;
            case VoteType.For:
                proposal.forVotes = proposal.forVotes.plus(BigInt.fromString('1'))
                break;
            case VoteType.Abstain:
                proposal.abstainVotes = proposal.abstainVotes.plus(BigInt.fromString('1'))
                break;                
          }
        proposal.save()
    }
}

