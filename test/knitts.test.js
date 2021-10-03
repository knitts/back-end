const assert = require("assert");
const League = artifacts.require("League");
const Knitts = artifacts.require("Knitts");
const User = artifacts.require("User");
const Web3 = require('web3');
const web3 = new Web3('HTTP://127.0.0.1:7545');
const NFT = artifacts.require("NFT");



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



// describe('quick tests', async()=>{
//     var knitts, user;
//     var accounts;
//     var organization, moderator;
//     const _entryFee = web3.utils.toWei('0.001', 'ether'), _numPlayers = 3, _duration = 10;
//     const _deposit = web3.utils.toWei('0.01', 'ether');
//     before(async()=>{
//         accounts = await web3.eth.getAccounts();
//         organization = moderator = accounts[0];
//         knitts = await Knitts.new({from:organization});
//     });
//     it('should have created knitts contract', async()=>{
//         ;
//     });
//     it('should have created a contest', async()=>{
//         await knitts.createLeague.sendTransaction(_entryFee, _numPlayers, _duration, {from:moderator, value:_deposit});
//     });
//     it('returns static variables', async()=>{
//         var numLeagues = await knitts.numLeagues.call();
//         assert(numLeagues == 1, "numLeagues not updated properly");
//     });
//     it('should register an user', async()=>{
//         user = await User.new(accounts[1], "Arvinth");
//         await knitts.register.sendTransaction(accounts[1], user.address);
//         var userConractAddress = await knitts.idToUser.call(accounts[1]);
//         assert(userConractAddress == user.address, 'user contract address mismatch');
//     });
// });

describe('Knitts', async function(){
    var knitts, user;
    var accounts;
    var organization, moderator;
    const _entryFee = web3.utils.toWei('0.001', 'ether'), _numPlayers = 3, _duration = 10;
    const _deposit = web3.utils.toWei('0.01', 'ether');
    before(async()=>{
        accounts = await web3.eth.getAccounts();
        organization = moderator = accounts[0];
        knitts = await Knitts.new({from:organization});
    });
    it('should have created knitts contract', async()=>{
        ;
    });
    it('should have created a contest', async()=>{
        await knitts.createLeague.sendTransaction(_entryFee, _numPlayers, _duration, {from:moderator, value:_deposit});
    });
    it('returns static variables', async()=>{
        var numLeagues = await knitts.numLeagues.call();
        assert(numLeagues == 1, "numLeagues not updated properly");
    });
    it('should register an user', async()=>{
        user = await User.new(accounts[1], "Arvinth");
        await knitts.register.sendTransaction(accounts[1], user.address);
        var userConractAddress = await knitts.idToUser.call(accounts[1]);
        assert(userConractAddress == user.address, 'user contract address mismatch');
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
        knitts = await Knitts.new({from:organization});
        
        sentence = ["OM", "NAMO", "NARAYANA"];
        description = convert2Bytes(sentence, 20);
    });
    it('should allow users to register', async()=>{
        for(let i=0; i<6 ; i++){
            _user = await User.new(accounts[i], "Arvinth", {from: accounts[i]});
            await knitts.register.sendTransaction(accounts[i], _user.address, { from: organization});
        }
    });
    it('should allow moderator to create a league', async()=>{
        await knitts.createLeague.sendTransaction(_entryFee, _numPlayers, _duration, {from:moderator, value:_deposit});
        var numLeagues = await knitts.numLeagues.call();
        var leagueAddress = await knitts.Leagues.call(numLeagues-1);
        league = await League.at(leagueAddress);
        assert(await league.moderator() == moderator, "moderator address is different");
    });
    it('should allow participants to enter', async()=>{
        await league.submitIdea.sendTransaction(title, url, image, description, {from: participants[0], value: web3.utils.toWei('0.1', 'ether')});
        await league.submitIdea.sendTransaction(title, url, image, description, {from: participants[1], value: web3.utils.toWei('0.1', 'ether')});
        var numParticipants = await league.numProjects.call();
        assert(numParticipants == 2, 'participants not updated properly');
    });

    it('allows investor to invest', async()=>{
        await league.invest.sendTransaction(0, {from:investors[0], value: web3.utils.toWei('1', 'ether')});
        await league.invest.sendTransaction(1, {from:investors[1], value: web3.utils.toWei('2', 'ether')});
        await league.invest.sendTransaction(0, {from: investors[2], value:web3.utils.toWei('1', 'ether')});
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
        
        await league.endLeague.sendTransaction({from: organization});
        points = [];
        var numParticipants = await league.numProjects.call();
        for(let i=0; i<numParticipants; i++){
            points.push(await league.points.call(i));
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
        let userConractAddress = await knitts.idToUser.call( participants[0] , { from:organization})
        user = await User.at(userConractAddress);
    });
    it('Returns the details of the users & their projects - 2', async () => {
        let userConractAddress = await knitts.idToUser.call( participants[1] , { from:organization})
        user = await User.at(userConractAddress);
    });
});


describe('NFT', ()=>{
    before(async ()=>{
        accounts = await web3.eth.getAccounts();
        nft = await NFT.new(accounts[0], 'GOLD', 'G', accounts[0], 'google.com', 10, 1, {from:accounts[0]});
    });
    it('should have minted the nfts', async()=>{
        var balance = await nft.balanceOf(accounts[0]);
        assert(balance > 0, 'the balance should be greater than 0');
    });

    it('should return owner id', async()=>{
        var owner = await nft.ownerOf.call(1);
        assert(owner == accounts[0], "Owner address is wrong");
    });

    it('should transfer ownership', async()=>{
        await nft.approve.sendTransaction(accounts[1], 1, {from: accounts[0]});
        await nft.transferFrom.sendTransaction(accounts[0], accounts[1], 1);
        var owner = await nft.ownerOf.call(1);
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
        knitts = await Knitts.new({from:organization});
        
        sentence = ["OM", "NAMO", "NARAYANA"];
        description = convert2Bytes(sentence, 20);

    });
    it('should allow users to register', async()=>{
        for(let i=0; i<7 ; i++){
            _user = await User.new(accounts[i], "Arvinth", {from: accounts[i]});
            await knitts.register.sendTransaction(accounts[i], _user.address, { from: organization});
        }
    });

    it('allows investor to create NFT', async()=>{
        let userConractAddress = await knitts.idToUser.call( investors[0] , { from:organization})
        user = await User.at(userConractAddress);
        await user.createNFT.sendTransaction(1, _price, {from:investors[0]});
        nft = await user.NFTs_created.call(0);
        nft = await NFT.at(nft);
        await nft.approve.sendTransaction(nft.address, 1, {from:investors[0]});
        // assert(await nft.ownerOf.call(1) == investors[0], 'invalid owner');
    });

    it('allows investor to sell NFT', async()=>{
        // await nft.approve.sendTransaction(buyer, 1, {from: investors[0]});
        await nft.buy.sendTransaction({from: buyer, value: web3.utils.toWei('2', 'ether')});
        await nft.transferFrom.sendTransaction(nft.address, buyer, 1, {from: buyer});
        var owner = await nft.ownerOf.call(1);
        assert(owner == buyer, "Owner address is not updated");
    });

    it('should allow moderator to create a league', async()=>{
        await knitts.createLeague.sendTransaction(_entryFee, _numPlayers, _duration, {from:moderator, value:_deposit});
        var numLeagues = await knitts.numLeagues.call();
        var leagueAddress = await knitts.Leagues.call(numLeagues-1);
        league = await League.at(leagueAddress);
        assert(await league.moderator() == moderator, "moderator address is different");
    });

    it('should allow participants to enter', async()=>{
        await league.submitIdea.sendTransaction(title, url, image, description, {from: participants[0], value: web3.utils.toWei('0.1', 'ether')});
        await league.submitIdea.sendTransaction(title, url, image, description, {from: participants[1], value: web3.utils.toWei('0.1', 'ether')});
        var numParticipants = await league.numProjects.call();
        assert(numParticipants == 2, 'participants not updated properly');
    });

    it('allows investor to invest', async()=>{
        await league.invest.sendTransaction(0, {from:investors[0], value: web3.utils.toWei('1', 'ether')});
        await league.invest.sendTransaction(1, {from:investors[1], value: web3.utils.toWei('2', 'ether')});
        await league.invest.sendTransaction(0, {from: investors[2], value:web3.utils.toWei('1', 'ether')});
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
        
        await league.endLeague.sendTransaction({from: organization});
        points = [];
        var numParticipants = await league.numProjects.call();
        for(let i=0; i<numParticipants; i++){
            points.push(await league.points.call(i));
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
        let userConractAddress = await knitts.idToUser.call( participants[0] , { from:organization})
        user = await User.at(userConractAddress);
    });
    it('Returns the details of the users & their projects - 2', async () => {
        let userConractAddress = await knitts.idToUser.call( participants[1] , { from:organization})
        user = await User.at(userConractAddress);
    });
});
