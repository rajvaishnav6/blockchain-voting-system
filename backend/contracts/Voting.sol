// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Voting {

    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    mapping(address => bool) public hasVoted;

    mapping(uint => Candidate) public candidates;

    uint public candidatesCount;

    event VoteCast(
        address voter,
        uint candidateId
    );

    constructor() {
        addCandidate("Candidate 1");
        addCandidate("Candidate 2");
    }

    function addCandidate(
        string memory _name
    ) private {

        candidatesCount++;

        candidates[candidatesCount] =
            Candidate(
                candidatesCount,
                _name,
                0
            );
    }

    function vote(uint _candidateId) public {

        require(
            !hasVoted[msg.sender],
            "Already voted"
        );

        require(
            _candidateId > 0 &&
            _candidateId <= candidatesCount,
            "Invalid candidate"
        );

        hasVoted[msg.sender] = true;

        candidates[_candidateId].voteCount++;

        emit VoteCast(
            msg.sender,
            _candidateId
        );
    }
}