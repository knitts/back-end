const Migrations = artifacts.require("Migrations");
const Knitts = artifacts.require("Knitts");
const League = artifacts.require("League");
const User = artifacts.require("User");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(Knitts);
  deployer.deploy(League, "0x604BCD042D2d5B355ecE14B6aC3224d23F29a51c", 0, 0, 0, "0x79e6234Ff4E7DB556F916FeBcE9e52a68D0B8879");
  deployer.deploy(User, "0x79e6234Ff4E7DB556F916FeBcE9e52a68D0B8879", "Arvinth");
};
