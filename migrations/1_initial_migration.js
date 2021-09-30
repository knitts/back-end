const Migrations = artifacts.require("Migrations");
const Knitts = artifacts.require("Knitts");
const League = artifacts.require("League");
const User = artifacts.require("User");
const NFT = artifacts.require("NFT");
const Web3 = require('web3');
const web3 = new Web3('HTTP://127.0.0.1:7545');

module.exports = async function (deployer) {
  deployer.deploy(NFT,"OM NAMO NARAYANA", "OM", '0xa1Ea98eF5d0DDB54b797e0EaA4Be8946da9b3e44', 'google.com', 10);
  deployer.deploy(Migrations);
  deployer.deploy(Knitts);
  deployer.deploy(League, "0x604BCD042D2d5B355ecE14B6aC3224d23F29a51c", 0, 0, 0, "0x79e6234Ff4E7DB556F916FeBcE9e52a68D0B8879");
  deployer.deploy(User, "0x79e6234Ff4E7DB556F916FeBcE9e52a68D0B8879", "Arvinth");
  
};
