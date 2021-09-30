const assert = require("assert");
const League = require("../../build/contracts/League.json");
const Knitts = require("../../build/contracts/Knitts.json");
const User = require("../../build/contracts/User.json");
const web3 = require('./web3');

var gasfee = 5e6;

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
        knitts = await new web3.eth.Contract(Knitts.abi, {from:organization});
        
    });
    it('should have created the contract', async()=>{
        ;
    });
    it("should allow user to enter to become moderator", async()=>{
        knitts = await new web3.eth.Contract(Knitts.abi, {from:organization});
        knitts = await knitts.deploy({data:Knitts.bytecode}).send({from:moderator, gas: gasfee}).then((instance)=>{
            return instance;
        });
        var current_balance = await knitts.methods.getBalance(moderator).call();
        await knitts.methods.addModerator().send({from: moderator, value:web3.utils.toWei('1', 'ether'), gasLimit: 1e8, gas: gasfee});
        var updated_balance = await knitts.methods.getBalance(moderator).call();
        assert(current_balance < updated_balance, "the balance is not updated");
    });
    it("should add more balance to the moderator account", async ()=>{
        var current_balance = await knitts.methods.getBalance(moderator).call();
        await knitts.methods.depositMore().send({from:moderator, value: web3.utils.toWei('1', 'ether')});
        var updated_balance = await knitts.methods.getBalance(moderator).call();
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
        knitts = await new web3.eth.Contract(Knitts.abi, {from:organization});
        knitts = await knitts.deploy({data:Knitts.bytecode}).send({from:organization, gas: gasfee});
        for(let i=0; i<3 ; i++){
            await knitts.methods.register("Arvinth").send({ from: accounts[i], gas: gasfee});
        }
        sentence = ["OM", "NAMO", "NARAYANA"];
        description = convert2Bytes(sentence, 20);
    });
    it('should allow moderator to create a league', async()=>{
        await knitts.methods.addModerator().send({from: moderator, value:web3.utils.toWei('1', 'ether'), gas: gasfee});
        await knitts.methods.createLeague(web3.utils.toWei('0.1', 'ether'), 3, 1000).send( {from:moderator , gas: gasfee});
        var leagueAddress = await knitts.methods.createLeague(web3.utils.toWei('0.1', 'ether'), 3, 1000).call( {from:moderator});

        // console.log('leagueaddress: ', leagueAddress);
        // var leagueAddress = await knitts.methods.createLeague(web3.utils.toWei('0.1', 'ether'), 3, 1000).call( {from:moderator , gas:1e7});
        // console.log('leagueaddress: ', leagueAddress);
        league = await new web3.eth.Contract(League.abi, leagueAddress[0]);
        var league_details = await league.methods.getDetails().call();
        assert(league_details[0] == moderator, "moderator address is different");
    });
    it('should allow participants to enter', async()=>{
        await league.methods.submitIdea('Knitt project', 'https://www.google.com/', 'https://www.google.com/', description).send({from: participants[0], value: web3.utils.toWei('0.1', 'ether'), gas: gasfee});
        await league.methods.submitIdea('Knitt project', 'https://www.google.com/', 'https://www.google.com/', description).send({from: participants[1], value: web3.utils.toWei('0.1', 'ether'), gas: gasfee});
        var numParticipants = await league.methods.submitIdea('Knitt project', 'https://www.google.com/', 'https://www.google.com/', description).call({from: participants[0], value: web3.utils.toWei('0.1', 'ether'), gas: gasfee});
        assert(numParticipants > 0, 'participants not updated properly');
        // console.log('# of participants:', numParticipants);
    }).timeout(20000);

    it('allows investor to invest', async()=>{
        await league.methods.invest(0).send({from:investors[0], value: web3.utils.toWei('1', 'ether'), gas: gasfee});
        await league.methods.invest(1).send({from:investors[1], value: web3.utils.toWei('2', 'ether'), gas: gasfee});
        await league.methods.invest(0).send({from: investors[2], value:web3.utils.toWei('1', 'ether'), gas: gasfee});
    }).timeout(20000);

    it('should return the points', async()=>{
        // await league.submitIdea.sendTransaction(description, {from: participants[1], value: web3.utils.toWei('0.1', 'ether')});
        points = await league.methods.endLeague().send({from: organization, gas: gasfee});
        points = await league.methods.endLeague().call({from: organization});
        console.log('points:', points);
    }).timeout(20000);

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
        await league.methods.distribute().send({from: organization, gas: gasfee});

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
    }).timeout(20000);
    it('Returns the details of the users & their projects', async () => {
        let userConractAddress = await knitts.methods.getUserContractAddress(participants[0]).call({ from:organization})
        user = await new web3.eth.Contract(User.abi, userConractAddress);
        let projectDetails = await user.methods.getDetails().call();
        console.log('points: ', projectDetails[0].point, 'average point:', projectDetails[0].average_point, 'submitted on: ', projectDetails[0].submittedOn);
    }).timeout(20000);
    it('Returns the details of the users & their projects - 2', async () => {
        let userConractAddress = await knitts.methods.getUserContractAddress( participants[1]).call({ from:organization})
        user = await new web3.eth.Contract( User.abi, userConractAddress);
        let projectDetails = await user.methods.getDetails().call();
    }).timeout(20000);
});



/*
rough pad:
words: [ 36392601, 11462121, 1294, <1 empty item> ] with sqrt function
words: [ 0, 36037632, 66860250, 17393732, 443734, <1 empty item> ] without sqrt function

knitts; 0xAe6c8ADf2fec27b2314Db4dA7C765AaF12b2D357
;eague: 0x2BedfB619A7534d755694bD08F744150f9a641a3
user: 0x4148806f2eEc63Ce0898Adcb4BD5227D9b942003

*/
