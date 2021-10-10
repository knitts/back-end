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
        // knitts = await Knitts.new({from:organization});

        // knitts = await new web3.eth.Contract(Knitts.abi, {from:organization});
        // knitts = await knitts.deploy({data:Knitts.bytecode}).send({from:moderator, gas: gasfee}).then((instance)=>{
        //     return instance;
        // });
    });
    it('should have created knitts contract', async()=>{
        // knitts = await new web3.eth.Contract(Knitts.abi, '0x21eE3Ef9Cf5b0866C15fD7c4bDb42d41235Ea652', {from:organization});
        knitts = await new web3.eth.Contract(Knitts.abi, {from:organization});
        // console.log('>>', Knitts.bytecode.toString());
        // knitts.data = await Knitts.bytecode
        knitts = await knitts.deploy({data:Knitts.bytecode}).send({from:moderator, gas: gasfee});
        // .then((instance)=>{
            // return instance;
        // });
    });
    it('should have created a contest', async()=>{
        await knitts.methods.createLeague(_entryFee, _numPlayers, _duration).send({from:moderator, value:_deposit, gasLimit: gasfee});
    });
    it('returns static variables', async()=>{
        var numLeagues = await knitts.methods.numLeagues().call();
        assert(numLeagues == 1, "numLeagues not updated properly");
    });
    it('should register an user', async()=>{
        // user = await User.new(accounts[1], "Arvinth");
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
        // knitts = await Knitts.new({from:organization});
        knitts = await new web3.eth.Contract(Knitts.abi, {from:organization});
        knitts = await knitts.deploy({data:Knitts.bytecode}).send({from:moderator, gas: gasfee}).then((instance)=>{
            return instance;
        });
        
        sentence = ["OM", "NAMO", "NARAYANA"];
        description = convert2Bytes(sentence, 20);
    });
    it('should allow users to register', async()=>{
        for(let i=0; i<6 ; i++){
            // _user = await User.new(accounts[i], "Arvinth", {from: accounts[i]});
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
        // knitts = await Knitts.new({from:organization});
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
            // _user = await User.new(accounts[i], "Arvinth", {from: accounts[i]});
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
        // console.log('user', userConractAddress);
        await user.methods.createNFT(1, _price).send({from:investors[0], gasLimit: gasfee});
        nft = await user.methods.NFTs_created(0).call();
        // console.log('nft', nft);
        nft = await new web3.eth.Contract(NFT.abi, (nft));
        await nft.methods.approve(nft.options.address, 1).send({from:investors[0]});
        // assert(await nft.ownerOf.call(1) == investors[0], 'invalid owner');
    });

    it('allows investor to sell NFT', async()=>{
        // await nft.approve.sendTransaction(buyer, 1, {from: investors[0]});
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


/*
0x21eE3Ef9Cf5b0866C15fD7c4bDb42d41235Ea652
*/

// function convert2BytesUtil(word){
//     return web3.utils.hexToBytes('0x'+Buffer.from(word, 'utf8').toString('hex'));
// }

// function convert2Bytes(sentence, limit=20){
//     var n = sentence.length;
//     var res = []
//     for(let i=0; i<n; i++){
//         let l = sentence[i].length;
//         assert(l <= limit, "max char reached");
//         res.push(convert2BytesUtil(sentence[i] + (" ".repeat(limit-l))));
//     }
//     return res;
// }


// function convert2StringUtil(byte){
//     return Buffer.from(byte, 'hex').toString('utf8');
// }

// function convert2String(bytes){
//     res = ""
//     let n = bytes.length;
//     for(let i=0; i<n; i++){
//         res += convert2StringUtil(bytes[i]);
//     }
//     return res;
// }

// describe('Knitts', async function(){
//     var knitts;
//     var accounts;
//     var organization;
//     var moderator;
//     var randomAccount;
//     before(async function(){
//         accounts = await web3.eth.getAccounts();
//         organization = moderator = accounts[0];
//         randomAccount = accounts[8];
//         knitts = await new web3.eth.Contract(Knitts.abi, {from:organization});
        
//     });
//     it('should have created the contract', async()=>{
//         ;
//     });
//     it("should allow user to enter to become moderator", async()=>{
//         knitts = await new web3.eth.Contract(Knitts.abi, {from:organization});
//         knitts = await knitts.deploy({data:Knitts.bytecode}).send({from:moderator, gas: gasfee}).then((instance)=>{
//             return instance;
//         });
//         var current_balance = await knitts.methods.getBalance(moderator).call();
//         await knitts.methods.addModerator().send({from: moderator, value:web3.utils.toWei('1', 'ether'), gasLimit: 1e8, gas: gasfee});
//         var updated_balance = await knitts.methods.getBalance(moderator).call();
//         assert(current_balance < updated_balance, "the balance is not updated");
//     });
//     it("should add more balance to the moderator account", async ()=>{
//         var current_balance = await knitts.methods.getBalance(moderator).call();
//         await knitts.methods.depositMore().send({from:moderator, value: web3.utils.toWei('1', 'ether')});
//         var updated_balance = await knitts.methods.getBalance(moderator).call();
//         assert(current_balance < updated_balance, "the balance is not updated");
//     });
// });


// describe('Knitts-League', async()=>{
//     var knitts;
//     var accounts;
//     var league;
//     var description;
//     var moderator;
//     var randomAccount;
//     var participants;
//     var investors;
//     var user;
//     before(async function(){
//         accounts = await web3.eth.getAccounts();
//         organization = moderator = accounts[0];
//         randomAccount = accounts[8];
//         participants = [accounts[1], accounts[2]];
//         investors = [accounts[3], accounts[4], accounts[5]];
//         knitts = await new web3.eth.Contract(Knitts.abi, {from:organization});
//         knitts = await knitts.deploy({data:Knitts.bytecode}).send({from:organization, gas: gasfee});
//         for(let i=0; i<3 ; i++){
//             await knitts.methods.register("Arvinth").send({ from: accounts[i], gas: gasfee});
//         }
//         sentence = ["OM", "NAMO", "NARAYANA"];
//         description = convert2Bytes(sentence, 20);
//     });
//     it('should allow moderator to create a league', async()=>{
//         await knitts.methods.addModerator().send({from: moderator, value:web3.utils.toWei('1', 'ether'), gas: gasfee});
//         await knitts.methods.createLeague(web3.utils.toWei('0.1', 'ether'), 3, 1000).send( {from:moderator , gas: gasfee});
//         var leagueAddress = await knitts.methods.createLeague(web3.utils.toWei('0.1', 'ether'), 3, 1000).call( {from:moderator});

//         // console.log('leagueaddress: ', leagueAddress);
//         // var leagueAddress = await knitts.methods.createLeague(web3.utils.toWei('0.1', 'ether'), 3, 1000).call( {from:moderator , gas:1e7});
//         // console.log('leagueaddress: ', leagueAddress);
//         league = await new web3.eth.Contract(League.abi, leagueAddress[0]);
//         var league_details = await league.methods.getDetails().call();
//         assert(league_details[0] == moderator, "moderator address is different");
//     });
//     it('should allow participants to enter', async()=>{
//         await league.methods.submitIdea('Knitt project', 'https://www.google.com/', 'https://www.google.com/', description).send({from: participants[0], value: web3.utils.toWei('0.1', 'ether'), gas: gasfee});
//         await league.methods.submitIdea('Knitt project', 'https://www.google.com/', 'https://www.google.com/', description).send({from: participants[1], value: web3.utils.toWei('0.1', 'ether'), gas: gasfee});
//         var numParticipants = await league.methods.submitIdea('Knitt project', 'https://www.google.com/', 'https://www.google.com/', description).call({from: participants[0], value: web3.utils.toWei('0.1', 'ether'), gas: gasfee});
//         assert(numParticipants > 0, 'participants not updated properly');
//         // console.log('# of participants:', numParticipants);
//     }).timeout(20000);

//     it('allows investor to invest', async()=>{
//         await league.methods.invest(0).send({from:investors[0], value: web3.utils.toWei('1', 'ether'), gas: gasfee});
//         await league.methods.invest(1).send({from:investors[1], value: web3.utils.toWei('2', 'ether'), gas: gasfee});
//         await league.methods.invest(0).send({from: investors[2], value:web3.utils.toWei('1', 'ether'), gas: gasfee});
//     }).timeout(20000);

//     it('should return the points', async()=>{
//         // await league.submitIdea.sendTransaction(description, {from: participants[1], value: web3.utils.toWei('0.1', 'ether')});
//         points = await league.methods.endLeague().send({from: organization, gas: gasfee});
//         points = await league.methods.endLeague().call({from: organization});
//         console.log('points:', points);
//     }).timeout(20000);

//     it('should distribute the amount', async()=>{
//         var init_balance = [
//                         await web3.eth.getBalance(accounts[0]),
//                         await web3.eth.getBalance(accounts[1]),
//                         await web3.eth.getBalance(accounts[2]),
//                         await web3.eth.getBalance(accounts[3]),
//                         await web3.eth.getBalance(accounts[4]),
//                         await web3.eth.getBalance(accounts[5]),
//                         await web3.eth.getBalance(accounts[6]),
//                         await web3.eth.getBalance(accounts[7]),
//                         await web3.eth.getBalance(accounts[8]),
//                         await web3.eth.getBalance(accounts[9]), 
//                         ];
//         await league.methods.distribute().send({from: organization, gas: gasfee});

//         var final_balance = [
//             await web3.eth.getBalance(accounts[0]),
//             await web3.eth.getBalance(accounts[1]),
//             await web3.eth.getBalance(accounts[2]),
//             await web3.eth.getBalance(accounts[3]),
//             await web3.eth.getBalance(accounts[4]),
//             await web3.eth.getBalance(accounts[5]),
//             await web3.eth.getBalance(accounts[6]),
//             await web3.eth.getBalance(accounts[7]),
//             await web3.eth.getBalance(accounts[8]),
//             await web3.eth.getBalance(accounts[9]), 
//             ];

//         console.log('init balance: ', init_balance);
//         console.log('final balance: ', final_balance);
//     }).timeout(20000);
//     it('Returns the details of the users & their projects', async () => {
//         let userConractAddress = await knitts.methods.getUserContractAddress(participants[0]).call({ from:organization})
//         user = await new web3.eth.Contract(User.abi, userConractAddress);
//         let projectDetails = await user.methods.getDetails().call();
//         console.log('points: ', projectDetails[0].point, 'average point:', projectDetails[0].average_point, 'submitted on: ', projectDetails[0].submittedOn);
//     }).timeout(20000);
//     it('Returns the details of the users & their projects - 2', async () => {
//         let userConractAddress = await knitts.methods.getUserContractAddress( participants[1]).call({ from:organization})
//         user = await new web3.eth.Contract( User.abi, userConractAddress);
//         let projectDetails = await user.methods.getDetails().call();
//     }).timeout(20000);
// });



// /*
// rough pad:
// words: [ 36392601, 11462121, 1294, <1 empty item> ] with sqrt function
// words: [ 0, 36037632, 66860250, 17393732, 443734, <1 empty item> ] without sqrt function
// knitts; 0xAe6c8ADf2fec27b2314Db4dA7C765AaF12b2D357
// ;eague: 0x2BedfB619A7534d755694bD08F744150f9a641a3
// user: 0x4148806f2eEc63Ce0898Adcb4BD5227D9b942003
// */