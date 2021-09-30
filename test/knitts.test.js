const assert = require("assert");
const League = artifacts.require("League");
const Knitts = artifacts.require("Knitts");
const User = artifacts.require("User");
const Web3 = require('web3');
const web3 = new Web3('HTTP://127.0.0.1:7545');
const NFT = artifacts.require("NFT");


function convert2BytesUtil(word){
    return web3.utils.hexToBytes('0x'+Buffer.from(word, 'utf8').toString('hex'));
}

function convert2Bytes(sentence, limit=20){
    var n = sentence.length;
    var res = []
    for(let i=0; i<n; i++){
        let l = sentence[i].length;
        assert(l <= limit, "max char reached");
        res.push(convert2BytesUtil(sentence[i] + (" ".repeat(limit-l))));
    }
    return res;
}


function convert2StringUtil(byte){
    return Buffer.from(byte, 'hex').toString('utf8');
}

function convert2String(bytes){
    res = ""
    let n = bytes.length;
    for(let i=0; i<n; i++){
        res += convert2StringUtil(bytes[i]);
    }
    return res;
}

describe('Knitts', async function(){
    var knitts;
    var accounts;
    var organization;
    var moderator;
    var randomAccount;
    before(async function(){
        accounts = await web3.eth.getAccounts();
        organization = moderator = accounts[0];
        randomAccount = accounts[8];
        knitts = await Knitts.new({from:organization});
        
    });
    it('should have created the contract', async()=>{
        ;
    });
    // it("should allow user to enter to become moderator", async()=>{
    //     var current_balance = await knitts.getBalance.call(moderator);
    //     await knitts.addModerator.sendTransaction({from: moderator, value:web3.utils.toWei('1', 'ether')});
    //     var updated_balance = await knitts.getBalance.call(moderator);
    //     assert(current_balance < updated_balance, "the balance is not updated");
    // });
    it("should add more balance to the moderator account", async ()=>{
        var current_balance = await knitts.getBalance.call(moderator);
        await knitts.depositMore.sendTransaction({from:moderator, value: web3.utils.toWei('1', 'ether')});
        var updated_balance = await knitts.getBalance.call(moderator);
        assert(current_balance < updated_balance, "the balance is not updated");
    });
});


describe('Knitts-League', async()=>{
    var knitts;
    var accounts;
    var league;
    var description;
    var moderator;
    var randomAccount;
    var participants;
    var investors;
    var user;
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
        await knitts.depositMore.sendTransaction({from: moderator, value:web3.utils.toWei('1', 'ether')});
        await knitts.depositMore.call({from: moderator, value:web3.utils.toWei('1', 'ether')});
        await knitts.createLeague.sendTransaction(web3.utils.toWei('0.1', 'ether'), 3, 1000, {from:moderator});
    
        var leagueAddress = await knitts.createLeague.call(web3.utils.toWei('0.1', 'ether'), 3, 1000, {from:moderator});
        league = await League.at(leagueAddress[0]);
        assert(await league.moderator() == moderator, "moderator address is different");
    });
    it('should allow participants to enter', async()=>{
        await league.submitIdea.sendTransaction('Knitt project', 'https://www.google.com/', 'https://www.google.com/', description, {from: participants[0], value: web3.utils.toWei('0.1', 'ether')});
        await league.submitIdea.sendTransaction('Knitt project', 'https://www.google.com/', 'https://www.google.com/', description, {from: participants[1], value: web3.utils.toWei('0.1', 'ether')});
        var numParticipants = await league.submitIdea.call('Knitt project', 'https://www.google.com/','https://www.google.com/',  description, {from: participants[0], value: web3.utils.toWei('0.1', 'ether')});
        assert(numParticipants > 0, 'participants not updated properly');
    });

    it('allows investor to invest', async()=>{
        await league.invest.sendTransaction(0, {from:investors[0], value: web3.utils.toWei('1', 'ether')});
        await league.invest.sendTransaction(1, {from:investors[1], value: web3.utils.toWei('2', 'ether')});
        await league.invest.sendTransaction(0, {from: investors[2], value:web3.utils.toWei('1', 'ether')});
    });

    it('should return the points', async()=>{
        // await league.submitIdea.sendTransaction(description, {from: participants[1], value: web3.utils.toWei('0.1', 'ether')});
        points = await league.endLeague.sendTransaction({from: organization});
        points = await league.endLeague.call({from: organization});
        console.log('points:', points);
    });

    it('should distribute the amount', async()=>{
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
                        await web3.eth.getBalance(accounts[9]), 
                        ];
        await league.distribute.sendTransaction({from: organization});

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

        console.log('init balance: ', init_balance);
        console.log('final balance: ', final_balance);
    })
    it('Returns the details of the users & their projects', async () => {
        let userConractAddress = await knitts.getUserContractAddress.call( participants[0] , { from:organization})
        user = await User.at(userConractAddress);
    });
    it('Returns the details of the users & their projects - 2', async () => {
        let userConractAddress = await knitts.getUserContractAddress.call( participants[1] , { from:organization})
        user = await User.at(userConractAddress);
    });
});


describe('NFT', ()=>{
    before(async ()=>{
        accounts = await web3.eth.getAccounts();
        nft = await NFT.new(accounts[0], 'GOLD', 'G', accounts[0], 'google.com', 10, {from:accounts[0]});
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
    var knitts;
    var accounts;
    var league;
    var description;
    var moderator;
    var randomAccount;
    var participants;
    var investors;
    var user;
    var nft;
    var buyer;
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
        let userConractAddress = await knitts.getUserContractAddress.call( investors[0] , { from:organization})
        user = await User.at(userConractAddress);
        await user.createNFT.sendTransaction(1, {from:investors[0]});
        nft = await user.NFTs_created.call(0);
        nft = await NFT.at(nft);
        assert(await nft.ownerOf.call(1) == investors[0], 'invalid owner');
    });

    it('allows investor to sell NFT', async()=>{
        await nft.approve.sendTransaction(buyer, 1, {from: investors[0]});
        await nft.transferFrom.sendTransaction(investors[0], buyer, 1, {from: investors[0]});
        var owner = await nft.ownerOf.call(1);
        assert(owner == buyer, "Owner address is not updated");
    });

    it('should allow moderator to create a league', async()=>{
        await knitts.depositMore.sendTransaction({from: moderator, value:web3.utils.toWei('1', 'ether')});
        await knitts.depositMore.call({from: moderator, value:web3.utils.toWei('1', 'ether')});
        await knitts.createLeague.sendTransaction(web3.utils.toWei('0.1', 'ether'), 3, 1000, {from:moderator});
    
        var leagueAddress = await knitts.createLeague.call(web3.utils.toWei('0.1', 'ether'), 3, 1000, {from:moderator});
        league = await League.at(leagueAddress[0]);
        assert(await league.moderator() == moderator, "moderator address is different");
    });
    it('should allow participants to enter', async()=>{
        await league.submitIdea.sendTransaction('Knitt project', 'https://www.google.com/', 'https://www.google.com/', description, {from: participants[0], value: web3.utils.toWei('0.1', 'ether')});
        await league.submitIdea.sendTransaction('Knitt project', 'https://www.google.com/', 'https://www.google.com/', description, {from: participants[1], value: web3.utils.toWei('0.1', 'ether')});
        var numParticipants = await league.submitIdea.call('Knitt project', 'https://www.google.com/','https://www.google.com/',  description, {from: participants[0], value: web3.utils.toWei('0.1', 'ether')});
        assert(numParticipants > 0, 'participants not updated properly');
    });

    it('allows investor to invest', async()=>{
        await league.invest.sendTransaction(0, {from:investors[0], value: web3.utils.toWei('1', 'ether')});
        await league.invest.sendTransaction(1, {from:investors[1], value: web3.utils.toWei('2', 'ether')});
        await league.invest.sendTransaction(0, {from: investors[2], value:web3.utils.toWei('1', 'ether')});
    });

    it('should return the points', async()=>{
        // await league.submitIdea.sendTransaction(description, {from: participants[1], value: web3.utils.toWei('0.1', 'ether')});
        points = await league.endLeague.sendTransaction({from: organization});
        points = await league.endLeague.call({from: organization});
    });

    it('should distribute the amount', async()=>{
        var init_balance = await web3.eth.getBalance(buyer);
        await league.distribute.sendTransaction({from: organization});

        var final_balance = await web3.eth.getBalance(buyer);
        assert(final_balance - init_balance > 0, "nft not swiped");
    });


    it('Returns the details of the users & their projects', async () => {
        let userConractAddress = await knitts.getUserContractAddress.call( participants[0] , { from:organization})
        user = await User.at(userConractAddress);
    });
    it('Returns the details of the users & their projects - 2', async () => {
        let userConractAddress = await knitts.getUserContractAddress.call( participants[1] , { from:organization})
        user = await User.at(userConractAddress);
    });
});
