/**
 * context/Web3Context.jsx
 * Manages MetaMask connection — targets whichever network
 * VITE_CHAIN_ID specifies (now Sepolia, not Ganache).
 */

import contractData from "../contracts/VotingSystem.json";
import {
  createContext, useContext, useState, useEffect, useCallback, useMemo
} from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";

const contractABI = contractData.abi;
const contractAddress =
  import.meta.env.VITE_CONTRACT_ADDRESS || contractData.address;
const EXPECTED_CHAIN_ID     = parseInt(import.meta.env.VITE_CHAIN_ID || "11155111");
const EXPECTED_CHAIN_ID_HEX = "0x" + EXPECTED_CHAIN_ID.toString(16);

// Sirf messages ke liye — network ka naam dynamically decide hota hai
const NETWORK_NAMES = {
  1:        "Ethereum Mainnet",
  11155111: "Sepolia",
  1337:     "Ganache Local",
  31337:    "Hardhat Local",
};
const EXPECTED_NETWORK_NAME = NETWORK_NAMES[EXPECTED_CHAIN_ID] || `Chain ${EXPECTED_CHAIN_ID}`;

// Agar MetaMask mein network add karni pade, yeh RPC use hoga
const RPC_URL_FOR_ADD = import.meta.env.VITE_GANACHE_URL || "https://rpc.sepolia.org";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [provider,       setProvider]       = useState(null);
  const [signer,         setSigner]         = useState(null);
  const [contract,       setContract]       = useState(null);
  const [walletAddress,  setWalletAddress]  = useState(null);
  const [chainId,        setChainId]        = useState(null);
  const [isConnected,    setIsConnected]    = useState(false);
  const [isConnecting,   setIsConnecting]   = useState(false);
  const [networkError,   setNetworkError]   = useState(null);

  const hasMetaMask = typeof window !== "undefined" && Boolean(window.ethereum);

  const connectWallet = useCallback(async () => {
    if (!hasMetaMask) {
      toast.error("MetaMask not detected. Please install the MetaMask extension.");
      return null;
    }

    setIsConnecting(true);
    setNetworkError(null);

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts.length) {
        toast.error("No accounts found. Please unlock MetaMask.");
        return null;
      }

      // ── Network check + AUTO SWITCH to the CORRECT network ────────────
      const chainIdHex     = await window.ethereum.request({ method: "eth_chainId" });
      const currentChainId = parseInt(chainIdHex, 16);

      if (currentChainId !== EXPECTED_CHAIN_ID) {
        toast.loading(`Switching to ${EXPECTED_NETWORK_NAME}…`, { id: "switch" });
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: EXPECTED_CHAIN_ID_HEX }],
          });
          toast.dismiss("switch");
          toast.success(`Switched to ${EXPECTED_NETWORK_NAME}!`);
        } catch (switchErr) {
          if (switchErr.code === 4902) {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [{
                  chainId:           EXPECTED_CHAIN_ID_HEX,
                  chainName:         EXPECTED_NETWORK_NAME,
                  rpcUrls:           [RPC_URL_FOR_ADD],
                  nativeCurrency:    { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
                  blockExplorerUrls: ["https://sepolia.etherscan.io"],
                }],
              });
              toast.dismiss("switch");
              toast.success(`${EXPECTED_NETWORK_NAME} network added!`);
            } catch (addErr) {
              toast.dismiss("switch");
              toast.error(`Could not add ${EXPECTED_NETWORK_NAME}. Add it manually in MetaMask.`);
              setIsConnecting(false);
              return null;
            }
          } else {
            toast.dismiss("switch");
            toast.error(`Please switch to ${EXPECTED_NETWORK_NAME} manually in MetaMask.`);
            setIsConnecting(false);
            return null;
          }
        }
      }

      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const ethersSigner   = await ethersProvider.getSigner();
      const network        = await ethersProvider.getNetwork();

      let contractInstance = null;
      if (contractAddress && contractABI.length) {
        contractInstance = new ethers.Contract(contractAddress, contractABI, ethersSigner);
      }

      setProvider(ethersProvider);
      setSigner(ethersSigner);
      setContract(contractInstance);
      setWalletAddress(accounts[0]);
      setChainId(Number(network.chainId));
      setIsConnected(true);
      setNetworkError(null);

      toast.success(`Wallet connected: ${accounts[0].slice(0, 6)}…${accounts[0].slice(-4)}`);
      return accounts[0];
    } catch (err) {
      const msg = err.code === 4001
        ? "Wallet connection rejected by user."
        : err.message || "Failed to connect wallet.";
      toast.error(msg);
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [hasMetaMask]);

  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setContract(null);
    setWalletAddress(null);
    setChainId(null);
    setIsConnected(false);
    setNetworkError(null);
    toast("Wallet disconnected.", { icon: "🔌" });
  }, []);

  const castVoteOnChain = useCallback(
    async (candidateId) => {
      if (!contract) throw new Error("Contract not initialized. Connect wallet first.");
      if (!signer)   throw new Error("Wallet not connected.");

      toast.loading("Sending vote transaction…", { id: "vote-tx" });
      const tx      = await contract.vote(candidateId);
      toast.loading("Waiting for blockchain confirmation… (Sepolia takes ~15-20 sec)", { id: "vote-tx" });
      const receipt = await tx.wait();
      toast.dismiss("vote-tx");
      return { txHash: tx.hash, receipt };
    },
    [contract, signer]
  );

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setWalletAddress(accounts[0]);
        toast("Account changed — refreshing…", { icon: "🔄" });
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged",    handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged",    handleChainChanged);
    };
  }, [disconnectWallet]);

  useEffect(() => {
    const autoConnect = async () => {
      if (!window.ethereum) return;
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (_) {}
    };
    autoConnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({
    provider, signer, contract, walletAddress, chainId,
    isConnected, isConnecting, networkError, hasMetaMask, contractAddress,
    connectWallet, disconnectWallet, castVoteOnChain,
  }), [
    provider, signer, contract, walletAddress, chainId, isConnected,
    isConnecting, networkError, hasMetaMask,
    connectWallet, disconnectWallet, castVoteOnChain,
  ]);

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export const useWeb3 = () => {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 must be used inside <Web3Provider>");
  return ctx;
};