const assert = require("assert");
const NFT = artifacts.require("NFT");
const Web3 = require('web3');
const web3 = new Web3('HTTP://127.0.0.1:7545');

describe('NFT', ()=>{
    before(async ()=>{
        accounts = await web3.eth.getAccounts();
        nft = await NFT.new('GOLD', 'G', {from:accounts[0]});
        await nft.awardItem.sendTransaction(accounts[0], 'google.com');
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