require("@nomicfoundation/hardhat-toolbox");
const dotenv = require("dotenv");

// Load .env file explicitly
dotenv.config({ path: '.env' });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        amoy: {
            url: "https://rpc-amoy.polygon.technology/",
            accounts: process.env.BLOCKCHAIN_PRIVATE_KEY ? [process.env.BLOCKCHAIN_PRIVATE_KEY] : [],
            chainId: 80002,
            gasPrice: 1500000000, // 1.5 gwei - optimized for low cost (~0.0006 POL per transaction)
        },
        localhost: {
            url: "http://127.0.0.1:8545"
        }
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    }
};
