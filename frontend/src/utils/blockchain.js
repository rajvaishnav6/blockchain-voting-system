import { ethers } from "ethers";

import contractABI from "./Voting.json";

const contractAddress =
  import.meta.env.VITE_CONTRACT_ADDRESS;

export const connectWallet = async () => {

  if (!window.ethereum) {
    alert("Install MetaMask");
    return;
  }

  await window.ethereum.request({
    method: "eth_requestAccounts"
  });

  const provider =
    new ethers.BrowserProvider(window.ethereum);

  const signer =
    await provider.getSigner();

  return signer;
};

export const voteOnBlockchain =
  async (candidateId) => {

    const signer =
      await connectWallet();

    const contract =
      new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

    const tx =
      await contract.vote(candidateId);

    await tx.wait();

    return tx.hash;
};