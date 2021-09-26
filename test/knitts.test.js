const assert = require("assert");
const League = artifacts.require("League");
const Knitts = artifacts.require("Knitts");
const Web3 = require('web3');
const web3 = new Web3('HTTP://127.0.0.1:7545');



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
    it("should allow user to enter to become moderator", async()=>{
        var current_balance = await knitts.getBalance.call(moderator);
        await knitts.addModerator.sendTransaction({from: moderator, value:web3.utils.toWei('1', 'ether')});
        var updated_balance = await knitts.getBalance.call(moderator);
        assert(current_balance < updated_balance, "the balance is not updated");
    });
    it("should add more balance to the moderator account", async ()=>{
        var current_balance = await knitts.getBalance.call(moderator);
        await knitts.depositMore.sendTransaction({from:moderator, value: web3.utils.toWei('1', 'ether')});
        var updated_balance = await knitts.getBalance.call(moderator);
        assert(current_balance < updated_balance, "the balance is not updated");
    });
});


describe('League', async()=>{
    var league;
    var accounts;
    var description;
    var organization;
    var moderator;
    var randomAccount;
    var participants;
    before(async function(){
        accounts = await web3.eth.getAccounts();
        organization = moderator = accounts[0];
        randomAccount = accounts[8];
        participants = [accounts[1], accounts[2]];
        league = await League.new(moderator, web3.utils.toWei('0.1', 'ether'), 3, 1000, {from:moderator});
        sentence = ["OM", "NAMO", "NARAYANA"];
        description = convert2Bytes(sentence, 20);
    });
    it('should have created the league', async()=>{
        ;
    });
    it('should allow participants to join the league', async()=>{
        
        await league.submitIdea.sendTransaction(description, {from:participants[0], value: web3.utils.toWei('1', 'ether')});
        var projectId = await league.submitIdea.call(description, {from: randomAccount, value: web3.utils.toWei('1', 'ether')});
        // console.log(projectId);
        assert(projectId>0, 'incorrect projectId');
    });
    it('should have updated the project detials', async()=>{
        await league.submitIdea.sendTransaction(description, {from:participants[0], value: web3.utils.toWei('1', 'ether')});
        var projectId = await league.submitIdea.call(description, {from: randomAccount, value: web3.utils.toWei('1', 'ether')});
        var submissionDetails = await league.submissionDetails.call(projectId-2);
        console.log('read: ', convert2String(submissionDetails[1]));
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
    before(async function(){
        accounts = await web3.eth.getAccounts();
        organization = moderator = accounts[0];
        randomAccount = accounts[8];
        participants = [accounts[1], accounts[2]];
        investors = [accounts[3], accounts[4], accounts[5]];
        knitts = await Knitts.new(moderator, web3.utils.toWei('0.1', 'ether'), 3, 1000, {from:moderator});
        sentence = ["OM", "NAMO", "NARAYANA"];
        description = convert2Bytes(sentence, 20);
    });
    it('should allow moderator to create a league', async()=>{
        await knitts.addModerator.sendTransaction({from: moderator, value:web3.utils.toWei('1', 'ether')});
        await knitts.addModerator.call({from: moderator, value:web3.utils.toWei('1', 'ether')});
        await knitts.createLeague.sendTransaction(web3.utils.toWei('0.1', 'ether'), 3, 1000, {from:moderator});
        var leagueAddress = await knitts.createLeague.call(web3.utils.toWei('0.1', 'ether'), 3, 1000, {from:moderator});
        league = await League.at(leagueAddress[0]);
        var league_details = await league.getDetails.call();
        assert(league_details[0] == moderator, "moderator address is different");
    });
    it('should allow participants to enter', async()=>{
        await league.submitIdea.sendTransaction(description, {from: participants[0], value: web3.utils.toWei('0.1', 'ether')});
        await league.submitIdea.sendTransaction(description, {from: participants[1], value: web3.utils.toWei('0.1', 'ether')});
        var numParticipants = await league.submitIdea.call(description, {from: participants[0], value: web3.utils.toWei('0.1', 'ether')});
        assert(numParticipants > 0, 'participants not updated properly');
        console.log('# of participants:', numParticipants);
    });

    it('allows investor to invest', async()=>{
        await league.invest.sendTransaction(0, {from:investors[0], value: web3.utils.toWei('1', 'ether')});
        await league.invest.sendTransaction(1, {from:investors[1], value: web3.utils.toWei('2', 'ether')});
        await league.invest.sendTransaction(0, {from: investors[2], value:web3.utils.toWei('1', 'ether')});
    });

    it('should return the points', async()=>{
        await league.submitIdea.sendTransaction(description, {from: participants[1], value: web3.utils.toWei('0.1', 'ether')});
        points = await league.endLeague.sendTransaction({from: organization});
        points = await league.endLeague.call({from: organization});
        console.log('points:', points);
    });
});


/*
rough pad:
words: [ 36392601, 11462121, 1294, <1 empty item> ] with sqrt function
words: [ 0, 36037632, 66860250, 17393732, 443734, <1 empty item> ] without sqrt function
*/