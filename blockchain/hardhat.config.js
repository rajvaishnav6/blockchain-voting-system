require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/**
 * hardhat.config.js
 *
 * Configures Hardhat to connect to a local Ganache instance.
 * Make sure Ganache is running before deploying:
 *   npx ganache --port 7545
 *   — or —
 *   Open the Ganache GUI app and start a workspace.
 */

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    // ── Local Ganache (GUI or CLI) ────────────────────────────────────────
    ganache: {
      url:      process.env.GANACHE_URL || "http://127.0.0.1:7545",
      chainId:  1337,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },

    // ── Ganache CLI default port ──────────────────────────────────────────
    localhost: {
      url:     "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // ── Sepolia testnet (optional) ────────────────────────────────────────
    sepolia: {
      url:      process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
      chainId: 11155111,
    },
  },

  // Path to save compiled artifacts
  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};