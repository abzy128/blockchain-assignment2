const { vars } = require("hardhat/config");
const ALCHEMY_API_KEY = vars.get("ALCHEMY_API_KEY");
const PRIVATE_KEY = vars.get("SEPOLIA_PRIVATE_KEY");

module.exports = {
  solidity: "0.8.27",
  networks: {
    sepolia:{
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY]
    },
    holesky:{
      url: `https://eth-holesky.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY]
    }
  },
};
require("@nomicfoundation/hardhat-toolbox");