// src/contractConfig.js
import { ethers } from "ethers";

export const SEPOLIA_RPC_URL =
  import.meta.env.VITE_SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID";

// Use your *already deployed* contract address
export const contractAddress =
  import.meta.env.VITE_CONTRACT_ADDRESS || "0x93ED569271192b67F33e9D15f42b02Fe15c2F5f8";

export function getReadOnlyProvider() {
  return new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
}

export async function getProviderAndSigner() {
  if (!window.ethereum) return { provider: null, signer: null };
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  return { provider, signer };
}

// ====== ABI ======
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
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "changeOwner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "_serialNumber", type: "string" },
      { internalType: "string", name: "_productionDate", type: "string" },
      { internalType: "string", name: "_productionLocation", type: "string" },
      { internalType: "string", name: "_manufacturer", type: "string" },
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
    inputs: [
      { internalType: "string", name: "_serialNumber", type: "string" },
      { internalType: "address", name: "_newOwner", type: "address" },
    ],
    name: "assignDeviceTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "_serialNumber", type: "string" },
      { internalType: "address", name: "_to", type: "address" },
    ],
    name: "transferDeviceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_serialNumber", type: "string" }],
    name: "verifyDevice",
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
