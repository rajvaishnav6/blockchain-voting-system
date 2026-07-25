// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title VotingSystem
 * @dev Secure blockchain voting contract with reset + remove capability
 */
contract VotingSystem {

    // ── Data Structures ──────────────────────────────────────────────────

    struct Candidate {
        uint256 id;
        string  name;
        string  party;
        uint256 voteCount;
        bool    isActive;        // NEW: false = removed/deactivated
    }

    struct Voter {
        bool    hasVoted;
        uint256 candidateId;
        uint256 timestamp;
        uint256 electionRound;
    }

    // ── State Variables ───────────────────────────────────────────────────

    address public owner;
    bool    public electionStarted;
    bool    public electionEnded;
    uint256 public candidateCount;
    uint256 public currentElectionRound;

    mapping(uint256 => Candidate) public candidates;
    mapping(address => Voter)     public voters;

    // ── Events ────────────────────────────────────────────────────────────

    event VoteCast(
        address indexed voter,
        uint256 indexed candidateId,
        uint256 timestamp
    );
    event ElectionStarted(uint256 timestamp);
    event ElectionEnded(uint256 timestamp);
    event CandidateAdded(uint256 indexed candidateId, string name, string party);
    event CandidateRemoved(uint256 indexed candidateId, uint256 timestamp);   // NEW
    event ElectionReset(uint256 indexed newRound, uint256 timestamp);

    // ── Modifiers ─────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "VotingSystem: caller is not the owner");
        _;
    }

    modifier electionActive() {
        require(electionStarted, "VotingSystem: election has not started yet");
        require(!electionEnded,  "VotingSystem: election has already ended");
        _;
    }

    modifier beforeElection() {
        require(!electionStarted, "VotingSystem: election already started");
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────

    constructor() {
        owner                = msg.sender;
        electionStarted      = false;
        electionEnded        = false;
        candidateCount       = 0;
        currentElectionRound = 1;
    }

    // ── Admin Functions ───────────────────────────────────────────────────

    function addCandidate(string memory _name, string memory _party)
        public
        onlyOwner
        beforeElection
    {
        require(bytes(_name).length  > 0, "VotingSystem: name cannot be empty");
        require(bytes(_party).length > 0, "VotingSystem: party cannot be empty");

        candidateCount++;
        candidates[candidateCount] = Candidate({
            id:        candidateCount,
            name:      _name,
            party:     _party,
            voteCount: 0,
            isActive:  true
        });

        emit CandidateAdded(candidateCount, _name, _party);
    }

    /**
     * @notice Remove (deactivate) a candidate before the election starts.
     * @dev Solidity can't truly "delete" from a mapping the way arrays
     *      work, so instead we flip isActive to false. Deactivated
     *      candidates cannot be voted for and are excluded from
     *      getAllCandidates(), getWinner(), and getTotalVotes().
     */
    function removeCandidate(uint256 _candidateId)
        public
        onlyOwner
        beforeElection
    {
        require(
            _candidateId > 0 && _candidateId <= candidateCount,
            "VotingSystem: invalid candidate ID"
        );
        require(
            candidates[_candidateId].isActive,
            "VotingSystem: candidate already removed"
        );

        candidates[_candidateId].isActive = false;

        emit CandidateRemoved(_candidateId, block.timestamp);
    }

    function startElection() public onlyOwner beforeElection {
        require(candidateCount > 0, "VotingSystem: no candidates have been added");

        // Make sure at least one ACTIVE candidate exists
        bool hasActive = false;
        for (uint256 i = 1; i <= candidateCount; i++) {
            if (candidates[i].isActive) { hasActive = true; break; }
        }
        require(hasActive, "VotingSystem: no active candidates to vote for");

        electionStarted = true;
        emit ElectionStarted(block.timestamp);
    }

    function endElection() public onlyOwner {
        require(electionStarted, "VotingSystem: election has not started");
        require(!electionEnded,  "VotingSystem: election already ended");
        electionEnded = true;
        emit ElectionEnded(block.timestamp);
    }

    /**
     * @notice Reset the election so a brand-new round can start
     *         WITHOUT redeploying the contract. Candidates are KEPT.
     */
    function resetElection() public onlyOwner {
        for (uint256 i = 1; i <= candidateCount; i++) {
            candidates[i].voteCount = 0;
        }

        currentElectionRound++;
        electionStarted = false;
        electionEnded   = false;

        emit ElectionReset(currentElectionRound, block.timestamp);
    }

    // ── Voter Functions ───────────────────────────────────────────────────

    function vote(uint256 _candidateId) public electionActive {
        require(!hasVoted(msg.sender), "VotingSystem: you have already voted");
        require(
            _candidateId > 0 && _candidateId <= candidateCount,
            "VotingSystem: invalid candidate ID"
        );
        require(
            candidates[_candidateId].isActive,
            "VotingSystem: this candidate has been removed"
        );

        voters[msg.sender] = Voter({
            hasVoted:      true,
            candidateId:   _candidateId,
            timestamp:     block.timestamp,
            electionRound: currentElectionRound
        });

        candidates[_candidateId].voteCount++;

        emit VoteCast(msg.sender, _candidateId, block.timestamp);
    }

    // ── View / Query Functions ──────────────────────────────────────────

    function getCandidate(uint256 _candidateId)
        public
        view
        returns (Candidate memory)
    {
        require(
            _candidateId > 0 && _candidateId <= candidateCount,
            "VotingSystem: invalid candidate ID"
        );
        return candidates[_candidateId];
    }

    /**
     * @notice Returns only ACTIVE (non-removed) candidates.
     */
    function getAllCandidates() public view returns (Candidate[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= candidateCount; i++) {
            if (candidates[i].isActive) activeCount++;
        }

        Candidate[] memory activeCandidates = new Candidate[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 1; i <= candidateCount; i++) {
            if (candidates[i].isActive) {
                activeCandidates[idx] = candidates[i];
                idx++;
            }
        }
        return activeCandidates;
    }

    function hasVoted(address _voter) public view returns (bool) {
        return voters[_voter].hasVoted
            && voters[_voter].electionRound == currentElectionRound;
    }

    function getVoterInfo(address _voter) public view returns (Voter memory) {
        return voters[_voter];
    }

    function getElectionStatus() public view returns (bool started, bool ended) {
        return (electionStarted, electionEnded);
    }

    function getTotalVotes() public view returns (uint256 total) {
        for (uint256 i = 1; i <= candidateCount; i++) {
            if (candidates[i].isActive) {
                total += candidates[i].voteCount;
            }
        }
        return total;
    }

    function getWinner() public view returns (Candidate memory winner) {
        require(candidateCount > 0, "VotingSystem: no candidates exist");
        uint256 maxVotes = 0;
        for (uint256 i = 1; i <= candidateCount; i++) {
            if (candidates[i].isActive && candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winner   = candidates[i];
            }
        }
        return winner;
    }
}