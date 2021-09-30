// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol"; 
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";


library MyMathlib{
    function sqrt(uint num) internal pure returns(uint){
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


contract Knitts{
    //organization address here
    address organization = 0x79e6234Ff4E7DB556F916FeBcE9e52a68D0B8879;
    mapping(address => uint) deposits;
    address[] public Leagues;
  	address[] Users;
    uint maxDescLength = 1000;
  	mapping(address => address) idToUser; 
  	mapping(address => bool) userExists;
  	
    function depositMore() public payable{
        require(msg.value > 0, "You need to deposit some amount");
        deposits[msg.sender] += msg.value;
    }

    function createLeague(uint _entryFee, uint _numPlayers, uint _duration) public returns(address[] memory){
        require(_entryFee * _numPlayers <= deposits[msg.sender], "Insufficient deposit");
        League newLeague = new League(msg.sender, _entryFee, _numPlayers, _duration, address(this));
        Leagues.push(address(newLeague));
        return Leagues;
    }

    function getBalance(address _moderator) public view returns (uint){
        return deposits[_moderator];
    }

  
  	function getUserContractAddress(address _id) public view returns(address) {
        return idToUser[_id];
    }
}

contract League{
    using  MyMathlib for uint;
    address public organization;
    uint public entryFee;
    uint public maxParticipants;
    uint public numProjects;
    address [] public participants;
    address public moderator;
    uint public duration;
    bool public started;
    bool public ended;
    bool public distributed;
  	uint public total_points=0;
    uint [] public points;
    address public knittsAddress;

    struct project{
        string title;
        string url;
        string image;
        address owner;
        bytes[20][] description;
        mapping(address => uint)investments;
        address[] investors;
        uint total_fund;
    }
		
    mapping(uint => project) projects;

    constructor(address _moderator, uint _entryFee, uint _maxParticipants, uint _duration, address _knittsAddress){
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
        knittsAddress = _knittsAddress;
    }

    function submitIdea(string memory title, string memory url, string memory image, bytes[20][] memory description) public payable returns(uint){
        require(msg.value >= entryFee, "Insufficient entry fee");
        require(numProjects < maxParticipants, "Maximum limit reached");
        project storage p = projects[numProjects++];
        // p = project({title:title, url:url, image:image, owner: msg.sender, description});
        p.title = title;
        p.url = url;
        p.image = image;
        p.owner = msg.sender;
        p.description = description;
        return numProjects;
    }

    function invest(uint projectId) public payable{
        // require(projectId < numProjects, "Invalid project id");
        project storage p = projects[projectId];
        if(p.investments[msg.sender] == 0){
            p.investors.push(msg.sender);
        }
        p.total_fund += msg.value/1e12;
        p.investments[msg.sender] += msg.value/1e12;
        
    }

    function startLeague() public{
        require(msg.sender == moderator, "only moderator");
        started=true;
    }

    function endLeague() public returns(uint[] memory){
        require(msg.sender == organization, "only organization");
        ended=true;
        getPoints();
      	
      	for(uint i=0; i<numProjects; i++){
            total_points += points[i];
        }

        uint averagePoints = total_points / numProjects;
      
      	for(uint i=0;i<numProjects; i++) {
            Knitts _knitts = Knitts(knittsAddress);
            address _userId = _knitts.getUserContractAddress(projects[i].owner);
            User _user = User(_userId);
            _user.addProject(projects[i].title, projects[i].url, projects[i].image, projects[i].description, points[i] , averagePoints, address(this) );
        } 

        return points;
    }

    function getPoints() internal returns(uint[] memory){
        require(ended = true, "the game has not ended");
        uint [] memory empty_points;
        points = empty_points;
        for(uint i=0; i < numProjects; i++){
            uint sum = 0;
            project storage p = projects[i];
            for(uint j=0; j< p.investors.length; j++){
                address inv = p.investors[j];
                sum += (p.investments[inv]).sqrt();
            }
            points.push(sum * sum);
        }
        
        return points;
    }

    function distribute() public {
        require(msg.sender == organization, "only organization");
        uint total_balance = address(this).balance;
        
        for(uint i=0; i<numProjects; i++){
            project storage p  =  projects[i];
            
            payable(p.owner).transfer( (3*points[i]*total_balance)/(10*total_points) );

            for(uint j=0; j<p.investors.length; j++){
                address investor = p.investors[j];
                payable(investor).transfer( (6 * points[i] * total_balance * p.investments[investor]) / (10 * total_points * p.total_fund) );
            }
        }

        payable(moderator).transfer(address(this).balance);

    }

    function submissionDetails(uint projectId) public view returns(
        address, // project owner
        bytes[20][] memory // description
    )  {
        return (projects[projectId].owner, projects[projectId].description);
    }

    
}


contract User {
    string name;
  	address id; //metamask address of corresponding user
  	uint numProjects=0;
    address[] public NFTs_created;
    bool public pending_nfts = false;
    constructor( address _id, string memory _name ) {
        name = _name;
        id = _id;
    }

    struct project{
        string title;
        string url;
        string image;
            bytes[20][] description;
            // uint total_fund;
            uint point;
            uint average_point;
            address submittedOn;
    }
        // mapping(uint => project) projects;

        project[20] public projects;
    
    function addProject(string memory title, string memory url, string memory image, bytes[20][] memory description, uint point, uint average_point, address submittedOn) public {
        project storage p = projects[numProjects++];
        p.title = title;
        p.url = url;
        p.image = image;
        p.description = description;
        p.point = point;
        p.average_point = average_point;
        p.submittedOn = submittedOn;
    }
    

    function createNFT(uint _bronze) public returns(address [] memory){
        require(_bronze <= 10, "You can create only 10 bronzes");
        require(pending_nfts == false, "There are pending nfts still");
        require(msg.sender == id, "wrong user account");
        for(uint i=0; i<_bronze; i++){
            NFT new_nft = new NFT("Bronze", "B", id, 'https://s3.envato.com/files/235568921/preview.jpg', 1);
            NFTs_created.push(address(new_nft));
        }
        return NFTs_created;
    }

    function scratchNFTs() public returns(uint){
        uint rem = 0;
        for(uint i=0; i<NFTs_created.length; i++){
            NFT new_nft =  NFT(NFTs_created[i]);
            rem = new_nft.scratchCard();
        }
        if(rem == 0){
            pending_nfts = false;
            address [] memory temp;
            NFTs_created = temp;
        }
        return rem;
    }
  
}

contract NFT is ERC721URIStorage, Ownable{
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address nft_creator;
    address nft_owner;
    uint leaguesMore;
    constructor(string memory _name, string memory _symbol, address _player, string memory _tokenURI, uint _leaguesMore) ERC721(_name, _symbol){
        nft_creator = msg.sender;
        nft_owner = msg.sender;
        leaguesMore = _leaguesMore;
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(_player, newItemId);
        _setTokenURI(newItemId, _tokenURI);
    }

    function scratchCard() public returns (uint){
        require(leaguesMore > 0, "expired");
        leaguesMore -= 1;
        if(leaguesMore == 0){
            _burn(1);
        }
        return leaguesMore;
    }
    

}

