const assert = require("assert");
const League = require("../../build/contracts/League.json");
const Knitts = require("../../build/contracts/Knitts.json");
const User = require("../../build/contracts/User.json");
const NFT = require("../../build/contracts/NFT.json");
const web3 = require('./web3');

var gasfee = 5e7;


function convert2Bytes(sentence, limit=20){
    var n = sentence.length;
    var res = []
    for(let i=0; i<n; i++){
        let l = sentence[i].length;
        assert(l <= limit, "max char reached");
        let word = sentence[i] + (" ".repeat(limit-l));
        res.push(web3.utils.hexToBytes('0x'+Buffer.from(word, 'utf8').toString('hex')));
    }
    return res;
}


function convert2String(bytes){
    res = ""
    let n = bytes.length;
    for(let i=0; i<n; i++){
        res += Buffer.from(bytes[i], 'hex').toString('utf8');
    }
    return res;
}


describe('Knitts', async function(){
    var knitts, user;
    var accounts;
    var organization, moderator;
    const _entryFee = web3.utils.toWei('0.001', 'ether'), _numPlayers = 3, _duration = 10;
    const _deposit = web3.utils.toWei('0.01', 'ether');
    before(async()=>{
        accounts = await web3.eth.getAccounts();
        organization = moderator = accounts[0];
    });
    it('should have created knitts contract', async()=>{
        knitts = await new web3.eth.Contract(Knitts.abi, {from:organization});
        knitts = await knitts.deploy({data:Knitts.bytecode}).send({from:moderator, gas: gasfee});
    });
    it('should have created a contest', async()=>{
        await knitts.methods.createLeague(_entryFee, _numPlayers, _duration).send({from:moderator, value:_deposit, gasLimit: gasfee});
    });
    it('returns static variables', async()=>{
        var numLeagues = await knitts.methods.numLeagues().call();
        assert(numLeagues == 1, "numLeagues not updated properly");
    });
    it('should register an user', async()=>{
        user = await new web3.eth.Contract(User.abi, {from:organization});
        user = await user.deploy({data:User.bytecode, arguments: [accounts[1], "Arvinth"]}).send({from:accounts[1], gasLimit: gasfee, gas:gasfee});
        
        await knitts.methods.register(accounts[1], user.options.address).send({ gasLimit: gasfee});
        var userConractAddress = await knitts.methods.idToUser(accounts[1]).call();
        assert(userConractAddress == user.options.address, 'user contract address mismatch');
    });
});


describe('Knitts-League', async()=>{
    var knitts, league, user;
    var title='Knitt project', url='https://www.google.com/', image='https://www.google.com/', description;
    var _deposit = web3.utils.toWei('0.01', 'ether'), _entryFee=web3.utils.toWei('0.001', 'ether');
    var _numPlayers=3, _duration=2;
    var accounts, moderator, participants, investors, randomAccount;
    before(async function(){
        accounts = await web3.eth.getAccounts();
        organization = moderator = accounts[0];
        randomAccount = accounts[8];
        participants = [accounts[1], accounts[2]];
        investors = [accounts[3], accounts[4], accounts[5]];
        knitts = await new web3.eth.Contract(Knitts.abi, {from:organization});
        knitts = await knitts.deploy({data:Knitts.bytecode}).send({from:moderator, gas: gasfee}).then((instance)=>{
            return instance;
        });
        
        sentence = ["OM", "NAMO", "NARAYANA"];
        description = convert2Bytes(sentence, 20);
    });
    it('should allow users to register', async()=>{
        for(let i=0; i<6 ; i++){
            _user = await new web3.eth.Contract(User.abi, {from:organization});
            _user = await _user.deploy({data:User.bytecode, arguments:[accounts[1], "Arvinth"]}).send({from:accounts[1], gas: gasfee}).then((instance)=>{
                return instance;
            });
            await knitts.methods.register(accounts[i], _user.options.address).send({ from: organization});
        }
    });
    it('should allow moderator to create a league', async()=>{
        await knitts.methods.createLeague(_entryFee, _numPlayers, _duration).send( {from:moderator, value:_deposit, gasLimit:gasfee});
        var numLeagues = await knitts.methods.numLeagues().call();
        var leagueAddress = await knitts.methods.Leagues(numLeagues-1).call();
        league = await new web3.eth.Contract(League.abi, (leagueAddress));
        assert(await league.methods.moderator().call() == moderator, "moderator address is different");
    });
    it('should allow participants to enter', async()=>{
        await league.methods.submitIdea(title, url, image, description).send( {from: participants[0], value: web3.utils.toWei('0.1', 'ether'), gasLimit: gasfee});
        await league.methods.submitIdea(title, url, image, description).send( {from: participants[1], value: web3.utils.toWei('0.1', 'ether'), gasLimit: gasfee});
        var numParticipants = await league.methods.numProjects().call();
        assert(numParticipants == 2, 'participants not updated properly');
    });

    it('allows investor to invest', async()=>{
        await league.methods.invest(0).send({from:investors[0], value: web3.utils.toWei('1', 'ether'), gasLimit: gasfee});
        await league.methods.invest(1).send({from:investors[1], value: web3.utils.toWei('2', 'ether'), gasLimit: gasfee});
        await league.methods.invest(0).send({from:investors[2], value: web3.utils.toWei('1', 'ether'), gasLimit: gasfee});
    });

    it('should return the points', async()=>{
        var init_balance = [
            await web3.eth.getBalance(accounts[0]),
            await web3.eth.getBalance(accounts[1]),
            await web3.eth.getBalance(accounts[2]),
            await web3.eth.getBalance(accounts[3]),
            await web3.eth.getBalance(accounts[4]),
            await web3.eth.getBalance(accounts[5]),
            await web3.eth.getBalance(accounts[6]),
            await web3.eth.getBalance(accounts[7]),
            await web3.eth.getBalance(accounts[8]),
            await web3.eth.getBalance(accounts[9])];
        
        await league.methods.endLeague().send({from: organization, gasLimit: gasfee});
        points = [];
        var numParticipants = await league.methods.numProjects().call();
        for(let i=0; i<numParticipants; i++){
            points.push(await league.methods.points(i).call());
        }
        console.log('points:', points);
        var final_balance = [
            await web3.eth.getBalance(accounts[0]),
            await web3.eth.getBalance(accounts[1]),
            await web3.eth.getBalance(accounts[2]),
            await web3.eth.getBalance(accounts[3]),
            await web3.eth.getBalance(accounts[4]),
            await web3.eth.getBalance(accounts[5]),
            await web3.eth.getBalance(accounts[6]),
            await web3.eth.getBalance(accounts[7]),
            await web3.eth.getBalance(accounts[8]),
            await web3.eth.getBalance(accounts[9]), 
            ];
        var difference = Array(10);
        for(let i=0; i<10; i++){
            difference[i]= final_balance[i] - init_balance[i];
        }
        console.log(difference);
        
    });

    it('Returns the details of the users & their projects', async () => {
        let userConractAddress = await knitts.methods.idToUser(participants[0]).call( { from:organization})
        user = await new web3.eth.Contract(User.abi, (userConractAddress));
    });
    it('Returns the details of the users & their projects - 2', async () => {
        let userConractAddress = await knitts.methods.idToUser(participants[1]).call( { from:organization})
        user = await new web3.eth.Contract(User.abi, (userConractAddress));
    });
});


describe('NFT', ()=>{
    var nft;
    var accounts
    before(async ()=>{
        accounts = await web3.eth.getAccounts();
        nft = await new web3.eth.Contract(NFT.abi, {from:accounts[0]})
        nft = await nft.deploy({data:NFT.bytecode, arguments:[accounts[0], 'GOLD', 'G', accounts[0], 'google.com', 10, 1]}).send( {from:accounts[0], gasLimit: gasfee});
    });
    it('should have minted the nfts', async()=>{
        var balance = await nft.methods.balanceOf(accounts[0]).call();
        assert(balance > 0, 'the balance should be greater than 0');
    });

    it('should return owner id', async()=>{
        var owner = await nft.methods.ownerOf(1).call();
        assert(owner == accounts[0], "Owner address is wrong");
    });

    it('should transfer ownership', async()=>{
        await nft.methods.approve(accounts[1], 1).send({from: accounts[0]});
        await nft.methods.transferFrom(accounts[0], accounts[1], 1).send();
        var owner = await nft.methods.ownerOf(1).call();
        assert(owner == accounts[1], "Owner address is not updated");
    });
});


describe('Knitts-League-NFT', async()=>{
    var knitts, league, user, nft;
    var title='Knitt project', url='https://www.google.com/', image='https://www.google.com/', description;
    var _deposit = web3.utils.toWei('0.01', 'ether'), _entryFee=web3.utils.toWei('0.001', 'ether'), _price = web3.utils.toWei('1', 'ether');
    var _numPlayers=3, _duration=2;
    var accounts, moderator, participants, investors, randomAccount, buyer;
    before(async function(){
        accounts = await web3.eth.getAccounts();
        organization = moderator = accounts[0];
        randomAccount = accounts[8];
        participants = [accounts[1], accounts[2]];
        investors = [accounts[3], accounts[4], accounts[5]];
        buyer = accounts[6];
        knitts = await new web3.eth.Contract(Knitts.abi, {from:organization});
        knitts = await knitts.deploy({data:Knitts.bytecode}).send({from:moderator, gas: gasfee}).then((instance)=>{
            return instance;
        });
        
        sentence = ["OM", "NAMO", "NARAYANA"];
        description = convert2Bytes(sentence, 20);
    });
    it('should allow users to register', async()=>{
        for(let i=0; i<6 ; i++){
            _user = await new web3.eth.Contract(User.abi, {from:organization});
            _user = await _user.deploy({data:User.bytecode, arguments:[accounts[i], "Arvinth"]}).send({from:accounts[i], gas: gasfee}).then((instance)=>{
                return instance;
            });
            await knitts.methods.register(accounts[i], _user.options.address).send({ from: organization});
        }
    });

    it('allows investor to create NFT', async()=>{
        let userConractAddress = await knitts.methods.idToUser(investors[0]).call(  { from:organization})
        user = await new web3.eth.Contract(User.abi, (userConractAddress));
        await user.methods.createNFT(1, _price).send({from:investors[0], gasLimit: gasfee});
        nft = await user.methods.NFTs_created(0).call();
        nft = await new web3.eth.Contract(NFT.abi, (nft));
        await nft.methods.approve(nft.options.address, 1).send({from:investors[0]});
    });

    it('allows investor to sell NFT', async()=>{
        await nft.methods.buy().send({from: buyer, value: web3.utils.toWei('2', 'ether')});
        await nft.methods.transferFrom(nft.options.address, buyer, 1).send({from: buyer});
        var owner = await nft.methods.ownerOf(1).call();
        assert(owner == buyer, "Owner address is not updated");
    });

    it('should allow moderator to create a league', async()=>{
        await knitts.methods.createLeague(_entryFee, _numPlayers, _duration).send( {from:moderator, value:_deposit, gasLimit:gasfee});
        var numLeagues = await knitts.methods.numLeagues().call();
        var leagueAddress = await knitts.methods.Leagues(numLeagues-1).call();
        league = await new web3.eth.Contract(League.abi, (leagueAddress));
        assert(await league.methods.moderator().call() == moderator, "moderator address is different");
    });
    it('should allow participants to enter', async()=>{
        await league.methods.submitIdea(title, url, image, description).send( {from: participants[0], value: web3.utils.toWei('0.1', 'ether'), gasLimit: gasfee});
        await league.methods.submitIdea(title, url, image, description).send( {from: participants[1], value: web3.utils.toWei('0.1', 'ether'), gasLimit: gasfee});
        var numParticipants = await league.methods.numProjects().call();
        assert(numParticipants == 2, 'participants not updated properly');
    });

    it('allows investor to invest', async()=>{
        await league.methods.invest(0).send({from:investors[0], value: web3.utils.toWei('1', 'ether'), gasLimit: gasfee});
        await league.methods.invest(1).send({from:investors[1], value: web3.utils.toWei('2', 'ether'), gasLimit: gasfee});
        await league.methods.invest(0).send({from:investors[2], value: web3.utils.toWei('1', 'ether'), gasLimit: gasfee});
    });

    it('should return the points', async()=>{
        var init_balance = [
            await web3.eth.getBalance(accounts[0]),
            await web3.eth.getBalance(accounts[1]),
            await web3.eth.getBalance(accounts[2]),
            await web3.eth.getBalance(accounts[3]),
            await web3.eth.getBalance(accounts[4]),
            await web3.eth.getBalance(accounts[5]),
            await web3.eth.getBalance(accounts[6]),
            await web3.eth.getBalance(accounts[7]),
            await web3.eth.getBalance(accounts[8]),
            await web3.eth.getBalance(accounts[9])];
        
        await league.methods.endLeague().send({from: organization, gasLimit: gasfee});
        points = [];
        var numParticipants = await league.methods.numProjects().call();
        for(let i=0; i<numParticipants; i++){
            points.push(await league.methods.points(i).call());
        }
        console.log('points:', points);
        var final_balance = [
            await web3.eth.getBalance(accounts[0]),
            await web3.eth.getBalance(accounts[1]),
            await web3.eth.getBalance(accounts[2]),
            await web3.eth.getBalance(accounts[3]),
            await web3.eth.getBalance(accounts[4]),
            await web3.eth.getBalance(accounts[5]),
            await web3.eth.getBalance(accounts[6]),
            await web3.eth.getBalance(accounts[7]),
            await web3.eth.getBalance(accounts[8]),
            await web3.eth.getBalance(accounts[9]), 
            ];
        var difference = Array(10);
        for(let i=0; i<10; i++){
            difference[i]= final_balance[i] - init_balance[i];
        }
        console.log(difference);
        
    });

    
    it('Returns the details of the users & their projects', async () => {
        let userConractAddress = await knitts.methods.idToUser(participants[0]).call( { from:organization})
        user = await new web3.eth.Contract(User.abi, (userConractAddress));
    });
    it('Returns the details of the users & their projects - 2', async () => {
        let userConractAddress = await knitts.methods.idToUser(participants[1]).call( { from:organization})
        user = await new web3.eth.Contract(User.abi, (userConractAddress));
    });
});
