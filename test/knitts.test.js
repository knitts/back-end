const assert = require("assert");
const League = artifacts.require("League");
const Knitts = artifacts.require("Knitts");
const Web3 = require('web3');
const web3 = new Web3('HTTP://127.0.0.1:7545');

describe('Knitts', async function(){
    var knitts;
    var accounts;
    before(async function(){
        accounts = await web3.eth.getAccounts();
        knitts = await Knitts.new({from:accounts[0]});
    });
    it('should have created the contract', async()=>{
        ;
    });
    it("should allow user to enter to become moderator", async()=>{
        var current_balance = await knitts.getBalance.call(accounts[0]);
        await knitts.addModerator.sendTransaction({from: accounts[0], value:web3.utils.toWei('1', 'ether')});
        var updated_balance = await knitts.getBalance.call(accounts[0]);
        assert(current_balance < updated_balance, "the balance is not updated");
    });
    it("should add more balance to the moderator account", async ()=>{
        var current_balance = await knitts.getBalance.call(accounts[0]);
        await knitts.depositMore.sendTransaction({from:accounts[0], value: web3.utils.toWei('1', 'ether')});
        var updated_balance = await knitts.getBalance.call(accounts[0]);
        assert(current_balance < updated_balance, "the balance is not updated");
    });
});


describe('League', async()=>{
    var league;
    var accounts;
    before(async function(){
        accounts = await web3.eth.getAccounts();
        league = await League.new(accounts[0], web3.utils.toWei('0.1', 'ether'), 3, 1000, {from:accounts[0]});
    });
    it('should have created the league', async()=>{
        ;
    });
    it('should allow participants to join the league', async()=>{
        var description = "OM";
        await league.submitIdea.sendTransaction(description, {from:accounts[1], value: web3.utils.toWei('1', 'ether')});
        var projectId = await league.submitIdea.call(description, {from: accounts[1], value: web3.utils.toWei('1', 'ether')});
        // console.log(projectId);
        assert(projectId>0, 'incorrect projectId');
    });
});

describe('Knitts-League', async()=>{
    var knits;
    var accounts;
    var league;
    before(async function(){
        accounts = await web3.eth.getAccounts();
        knitts = await Knitts.new(accounts[0], web3.utils.toWei('0.1', 'ether'), 3, 1000, {from:accounts[0]});
    });
    it('should allow moderator to create a league', async()=>{
        await knitts.addModerator.sendTransaction({from: accounts[1], value:web3.utils.toWei('1', 'ether')});
        await knitts.addModerator.call({from: accounts[1], value:web3.utils.toWei('1', 'ether')});
        await knitts.createLeague.sendTransaction(web3.utils.toWei('0.1', 'ether'), 3, 1000, {from:accounts[1]});
        var leagueAddress = await knitts.createLeague.call(web3.utils.toWei('0.1', 'ether'), 3, 1000, {from:accounts[1]});
        console.log('league address: ', leagueAddress[0]);
        league = await League.at(leagueAddress[0]);
        var league_details = await league.getDetails.call();
        assert(league_details[0] == accounts[1], "moderator address is different");
    });
});