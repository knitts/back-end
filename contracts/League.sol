// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

contract Knitts{
    //organization address here
    address organization = 0x79e6234Ff4E7DB556F916FeBcE9e52a68D0B8879;
    address[] moderators;//change this to mapping mapping(address=>bool)
    mapping(address=>bool) valid;
    mapping(address => uint) deposits;
    address[] Leagues;
    uint maxDescLength = 1000;
    function addModerator() public payable{
        require(msg.value > 0, "You should deposit some amount");
        moderators.push(msg.sender);
        deposits[msg.sender] = msg.value;
        valid[msg.sender]=true;
    }

    function depositMore() public payable{
        require(msg.value > 0, "You need to deposit some amount");
        deposits[msg.sender] += msg.value;
    }

    function createLeague(uint _entryFee, uint _numPlayers, uint _duration) public returns(address[] memory){
        require(_entryFee * _numPlayers <= deposits[msg.sender], "Insufficient deposit");
        League newLeague = new League(msg.sender, _entryFee, _numPlayers, _duration);
        Leagues.push(address(newLeague));
        return Leagues;
    }

    function getBalance(address _moderator) public view returns (uint){
        return deposits[_moderator];
    }

    function getDetails() public view returns (address [] memory, address [] memory){
        return (moderators, Leagues);
    }
    

    function removeModerator(address _moderator) public {
        valid[_moderator] = false;
    }
}

contract League{
    
    address organization;
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
        bytes[20][] description;
        mapping(address => uint)investments;
        address[] investors;
    }

    mapping(uint => project) projects;

    constructor(address _moderator, uint _entryFee, uint _maxParticipants, uint _duration){
        entryFee = _entryFee;
        maxParticipants = _maxParticipants;
        moderator = _moderator;
        duration = _duration;
        numProjects = 0;
        started=false;
        ended=false;
        distributed=false;
        //organization = 0x79e6234Ff4E7DB556F916FeBcE9e52a68D0B8879; //for public net
        organization = _moderator; // for local testing
    }

    function submitIdea(bytes[20][] memory description) public payable returns(uint){
        require(msg.value >= entryFee, "Insufficient entry fee");
        require(numProjects < maxParticipants, "Maximum limit reached");
        project storage p = projects[numProjects++];
        p.owner = msg.sender;
        p.description = description;
        return numProjects;
    }

    function invest(uint projectId) public payable{
        require(projectId < numProjects, "Invalid project id");
        if(projects[projectId].investments[msg.sender] == 0){
            projects[projectId].investors.push(msg.sender);
        }

        projects[projectId].investments[msg.sender] += msg.value;
        
    }

    function startLeague() public{
        require(msg.sender == moderator, "only moderator can start the league");
        started=true;
    }

    function endLeague() public returns(uint[] memory){
        require(msg.sender == organization, "only organization can end the league");
        ended=true;
        return getPoints();
    }

    function getPoints() private returns(uint[] memory){
        require(ended = true, "the game has not ended");
        // require(msg.sender == organization, "only organization get the points");
        // write quadratic funding code here
        for(uint i=0; i < numProjects; i++){
            uint sum = 0;
            for(uint j=0; j<projects[i].investors.length; j++){
                address investor = projects[i].investors[j];
                sum += sqrt(projects[i].investments[investor]);
            }
            uint point = sum * sum;
            points.push(point);
        }
        return points;
    }

    function distribute() public{
        require(msg.sender == organization, "only organization can distribute prizes");
        //write the quadratic function
    }

    function getDetails() public view returns(
        address,//moderator
        uint,//entry fee
        uint,//maxParticipants
        bool, //started
        bool, //ended
        bool //distributed
    ){
        return (moderator, entryFee, maxParticipants, started, ended, distributed);
    }

    function submissionDetails(uint projectId) public view returns(
        address, // project owner
        bytes[20][] memory // description
    )  {
        return (projects[projectId].owner, projects[projectId].description);
    }

    function sqrt(uint num) public pure returns(uint){
        uint start = 1;
        uint end = num;
        uint mid = start;
        while(start < end){
            mid = start + (end - start)/2;
            if(mid * mid >= num){
                end = mid;
            }else{
                start = mid+1;
            }
        }
        return end;
    }
}