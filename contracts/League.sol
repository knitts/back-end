// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

contract Knitts{
    //organization address here
    address organization = 0x604BCD042D2d5B355ecE14B6aC3224d23F29a51c;
    address[] moderators;
    mapping(address => uint) deposits;
    address[] Leagues;
    function addModerator() public payable{
        require(msg.value > 0, "You should deposit some amount");
        moderators.push(msg.sender);
        deposits[msg.sender] = msg.value;
    }

    function depositMore() public payable{
        require(msg.value >= 0, "You need to deposit some amount");
        deposits[msg.sender] += msg.value;
    }

    function createLeague(uint _entryFee, uint _numPlayers, uint _duration) public returns(address[] memory){
        require(_entryFee * _numPlayers <= _numPlayers, "Insufficient deposit");
        League newLeague = new League(msg.sender, _entryFee, _numPlayers, _duration);
        Leagues.push(address(newLeague));
        return Leagues;
    }

    
}

contract League{
    address organization = 0x604BCD042D2d5B355ecE14B6aC3224d23F29a51c;
    uint entryFee;
    uint maxParticipants;
    uint numProjects;
    address [] participants;
    address moderator;
    uint duration;
    bool started;
    bool ended;
    bool distributed;
    uint [] points;
    struct project{
        address owner;
        string description;
        mapping(address => uint)investments;
    }

    project [] projects;

    constructor(address _moderator, uint _entryFee, uint _maxParticipants, uint _duration){
        entryFee = _entryFee;
        maxParticipants = _maxParticipants;
        moderator = _moderator;
        duration = _duration;
        numProjects = 0;
        started=false;
        ended=false;
        distributed=false;
    }

    function submitIdea(string memory description) public returns(uint){
        require(numProjects < maxParticipants, "Maximum limit reached");
        project storage p = projects[numProjects++];
        p.owner = msg.sender;
        p.description = description;
        return numProjects;
    }

    function invest(uint projectId) public payable{
        require(projectId < numProjects, "Invalid project id");
        projects[projectId].investments[msg.sender] += msg.value;
    }

    function startLeague() public{
        require(msg.sender == moderator, "only moderator can start the league");
        started=true;
    }

    function endLeague() public{
        require(msg.sender == organization, "only organization can end the league");
        ended=true;
        getPoints();
    }

    function getPoints() public returns(uint[] memory){
        require(ended = true, "the game has not ended");
        require(msg.sender == organization, "only organization get the points");
        //write quadratic funding code here
        return points;
    }

    function distribute() public{
        require(msg.sender == organization, "only organization can distribute prizes");
        //write the quadratic function
    }
}