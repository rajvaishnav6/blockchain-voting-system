/**
 * deploy.js — Hardhat deployment script for VotingSystem
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network ganache
 *
 * After deploying, copy the printed contract address into:
 *   - backend/.env  → CONTRACT_ADDRESS=0x...
 *   - frontend/.env → VITE_CONTRACT_ADDRESS=0x...
 */

const hre = require("hardhat");
const fs  = require("fs");
const path = require("path");

async function main() {
  console.log("─────────────────────────────────────────────");
  console.log(" Deploying VotingSystem to", hre.network.name);
  console.log("─────────────────────────────────────────────");

  // Get the deployer's signer (first account in Ganache)
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address :", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance :", hre.ethers.formatEther(balance), "ETH\n");

  // Compile and deploy the contract
  const VotingSystem = await hre.ethers.getContractFactory("VotingSystem");
  const votingSystem = await VotingSystem.deploy();
  await votingSystem.waitForDeployment();

  const contractAddress = await votingSystem.getAddress();
  console.log("✅ VotingSystem deployed at:", contractAddress);
  console.log("\n─────────────────────────────────────────────");

  // ── Save the ABI + address to frontend/src/contracts ─────────────────────
  const artifact = await hre.artifacts.readArtifact("VotingSystem");

  const contractData = {
    address: contractAddress,
    abi:     artifact.abi,
    network: hre.network.name,
  };

  // Ensure the output directory exists
  const outputDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the combined ABI + address file
  const outputPath = path.join(outputDir, "VotingSystem.json");
  fs.writeFileSync(outputPath, JSON.stringify(contractData, null, 2));
  console.log("📄 ABI + address written to:", outputPath);
  console.log("\n ─── Copy the values below into your .env files ───");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log("─────────────────────────────────────────────\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });