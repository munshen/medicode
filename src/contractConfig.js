// src/contractConfig.js
import { ethers } from "ethers";

// ================== CONFIG ==================
// Your Sepolia RPC URL (Infura / Alchemy / any public RPC)
export const SEPOLIA_RPC_URL =
  import.meta.env.VITE_SEPOLIA_RPC_URL ||
  "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID";

// Deployed contract address (4-field version, no IPFS)
export const contractAddress =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  "0x93ED569271192b67F33e9D15f42b02Fe15c2F5f8";

// ================== PROVIDERS ==================

// Read-only provider (no wallet needed)
export function getReadOnlyProvider() {
  return new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
}

// Provider + signer (MetaMask)
export async function getProviderAndSigner() {
  if (!window.ethereum) return { provider: null, signer: null };

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    return { provider, signer };
  } catch (err) {
    console.error("Failed to get provider & signer:", err);
    return { provider: null, signer: null };
  }
}

// ================== CONTRACT ABI ==================
// Updated 4-field version: Serial, Date, Location, Manufacturer
export const contractABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "string", name: "serialNumber", type: "string" },
      { indexed: false, internalType: "string", name: "manufacturer", type: "string" },
    ],
    name: "DeviceRegistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "string", name: "serialNumber", type: "string" }],
    name: "DeviceRevoked",
    type: "event",
  },
  {
    inputs: [
      { internalType: "string", name: "_serialNumber", type: "string" },
      { internalType: "string", name: "_productionDate", type: "string" },
      { internalType: "string", name: "_productionLocation", type: "string" },
      { internalType: "string", name: "_manufacturer", type: "string" },
      { internalType: "string", name: "_ipfs", type: "string"},
    ],
    name: "registerDevice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_serialNumber", type: "string" }],
    name: "revokeDevice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_serialNumber", type: "string" }],
    name: "getDevice",
    outputs: [
      { internalType: "string", name: "serialNumber", type: "string" },
      { internalType: "string", name: "productionDate", type: "string" },
      { internalType: "string", name: "productionLocation", type: "string" },
      { internalType: "string", name: "manufacturer", type: "string" },
      { internalType: "bool", name: "valid", type: "bool" },
      { internalType: "address", name: "deviceOwner", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllSerials",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
];

// src/contractConfig.js (add at the bottom)
export async function registerNewDevice(device) {
  const { signer } = await getProviderAndSigner();
  if (!signer) throw new Error("MetaMask not connected");

  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  try {
    const tx = await contract.registerDevice(
      device.serialNumber,
      device.productionDate,
      device.productionLocation,
      device.manufacturer,
      "" // Empty IPFS
    );
    console.log("Transaction sent, waiting for confirmation...");
    await tx.wait();
    console.log("Device registered successfully:", device.serialNumber);
    return tx;
  } catch (err) {
    console.error("Failed to register device:", err);
    throw err;
  }
}
