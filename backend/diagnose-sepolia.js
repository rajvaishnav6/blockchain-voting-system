require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function diagnose() {
  console.log("========================================");
  console.log("Contract address check");
  console.log("========================================");
  const contractPath = path.join(__dirname, "../frontend/src/contracts/VotingSystem.json");
  const data = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  console.log("VotingSystem.json address:", data.address);
  console.log(".env CONTRACT_ADDRESS:    ", process.env.CONTRACT_ADDRESS);
  console.log("Match?", data.address.toLowerCase() === (process.env.CONTRACT_ADDRESS||"").toLowerCase() ? "✅" : "❌");

  console.log("\n========================================");
  console.log("Owner check (asli sach — blockchain se seedha)");
  console.log("========================================");
  const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL);
  const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  console.log("ADMIN_PRIVATE_KEY ka wallet address:", adminWallet.address);

  const contract = new ethers.Contract(data.address, data.abi, provider);
  const onChainOwner = await contract.owner();
  console.log("Contract ka ASLI owner (Sepolia se):", onChainOwner);

  const match = adminWallet.address.toLowerCase() === onChainOwner.toLowerCase();
  console.log("\n🎯 FINAL VERDICT: Owner match?", match ? "✅ YES — Sab sahi hai!" : "❌ NO — YEHI PROBLEM HAI!");

  const balance = await provider.getBalance(adminWallet.address);
  console.log("ADMIN wallet ka Sepolia ETH balance:", ethers.formatEther(balance), "ETH");
  if (balance === 0n) console.log("⚠️  Balance 0 hai — gas fee ke liye ETH chahiye!");
}

diagnose().catch(err => console.error("❌ ERROR:", err.message));