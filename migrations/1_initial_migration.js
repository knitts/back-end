const Migrations = artifacts.require("Migrations");
const Knitts = artifacts.require("Knitts");
const League = artifacts.require("League");
const User = artifacts.require("User");
const NFT = artifacts.require("NFT");
// const MyMathlib = artifacts.require("MyMathlib");

module.exports = async function (deployer) {
  await deployer.deploy(Migrations);
  // await deployer.deploy(MyMathlib);
  // await deployer.link(MyMathlib, Knitts);
  // await deployer.link(MyMathlib, League);
  await deployer.deploy(NFT,'0xa1Ea98eF5d0DDB54b797e0EaA4Be8946da9b3e44', "OM NAMO NARAYANA", "OM", '0xa1Ea98eF5d0DDB54b797e0EaA4Be8946da9b3e44', 'google.com', 10, 1);
  await deployer.deploy(Knitts);
  await deployer.deploy(League, "0x604BCD042D2d5B355ecE14B6aC3224d23F29a51c", web3.utils.toWei('0.01', 'ether'), 0, 0, 0, "0x79e6234Ff4E7DB556F916FeBcE9e52a68D0B8879");
  await deployer.deploy(User, "0x79e6234Ff4E7DB556F916FeBcE9e52a68D0B8879", "Arvinth");
};
