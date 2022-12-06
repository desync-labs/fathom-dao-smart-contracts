import { BigInt, Address } from "@graphprotocol/graph-ts";
import {ProposalCreated, VoteCast, VoteCastWithParams} from "../generated/Governor/Governor"
import { Proposal } from "../generated/schema";
import { Constants } from "./Utils/Constants"
import { Governor } from "../generated/Governor/Governor"


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
    proposal.values = event.params.values;
    proposal.signatures = event.params.signatures;
    proposal.calldatas = event.params.calldatas;
    proposal.againstVotes = BigInt.fromString('0');
    proposal.forVotes = BigInt.fromString('0');
    proposal.abstainVotes = BigInt.fromString('0');
    proposal.targets = [];

    let targets: string[] = [];
    for (let i = 0;  i < event.params.targets.length; i++) {
        targets.push(event.params.targets[i].toHexString());
    }
    proposal.targets = targets;

    let governorContract = Governor.bind(Address.fromString(Constants.GOVERNANCE))
    proposal.deadline =  governorContract.proposalDeadline(event.params.proposalId)
    

    // var str = event.params.description; 
    
    // var splitted = str.split("----------------", 2); 
    // // console.log(splitted)
    // proposal.title = splitted[0];
    // proposal.description = splitted[1];

    // proposal.title = event.params.description;
    proposal.description = event.params.description;



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
    
    // increment vote type count
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

