// src/contractConfig.js
import { ethers } from "ethers";

// ================== CONFIG ==================
export const SEPOLIA_RPC_URL =
  import.meta.env.VITE_SEPOLIA_RPC_URL ||
  "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID";

export const contractAddress =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  "0x93ED569271192b67F33e9D15f42b02Fe15c2F5f8"; // existing deployed contract

// ================== PROVIDERS ==================
export function getReadOnlyProvider() {
  return new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
}

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
// CORRECTED ABI - Using actual function names from deployed contract
export const contractABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "string", name: "serial", type: "string" },
      { indexed: false, internalType: "string", name: "manufacturer", type: "string" },
      { indexed: false, internalType: "string", name: "date", type: "string" },
      { indexed: false, internalType: "string", name: "location", type: "string" },
    ],
    name: "DeviceRegistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "string", name: "serial", type: "string" }],
    name: "DeviceRevoked",
    type: "event",
  },
  {
    inputs: [
      { internalType: "string", name: "serial", type: "string" },
      { internalType: "string", name: "date", type: "string" },
      { internalType: "string", name: "location", type: "string" },
      { internalType: "string", name: "manufacturer", type: "string" },
      { internalType: "string", name: "ipfsHash", type: "string" },
    ],
    name: "registerDevice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "serial", type: "string" }],
    name: "revokeDevice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "serial", type: "string" }],
    name: "isRegistered",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "serial", type: "string" }],
    name: "getDevice",
    outputs: [
      {
        components: [
          { internalType: "string", name: "serialNumber", type: "string" },
          { internalType: "string", name: "productionDate", type: "string" },
          { internalType: "string", name: "productionLocation", type: "string" },
          { internalType: "string", name: "manufacturer", type: "string" },
          { internalType: "string", name: "ipfsHash", type: "string" },
          { internalType: "bool", name: "valid", type: "bool" },
        ],
        internalType: "struct MediCode.Device",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "serial", type: "string" }],
    name: "verifyDevice",
    outputs: [
      { internalType: "string", name: "serialNumber", type: "string" },
      { internalType: "string", name: "productionDate", type: "string" },
      { internalType: "string", name: "productionLocation", type: "string" },
      { internalType: "string", name: "manufacturer", type: "string" },
      { internalType: "string", name: "ipfsHash", type: "string" },
      { internalType: "bool", name: "valid", type: "bool" },
      { internalType: "address", name: "deviceOwner", type: "address" }
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
  // CORRECTED: Using actual function names from contract
  {
    inputs: [
      { internalType: "string", name: "_serialNumber", type: "string" },
      { internalType: "address", name: "_newOwner", type: "address" }
    ],
    name: "assignDeviceTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // CORRECTED: Using actual function names from contract
  {
    inputs: [
      { internalType: "string", name: "_serialNumber", type: "string" },
      { internalType: "address", name: "_to", type: "address" }
    ],
    name: "transferDeviceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  }
];

// ================== HELPERS ==================

// sanitize helper
function sanitizeString(x) {
  if (x === undefined || x === null) return "";
  return String(x).replace(/\u0000/g, "").replace(/[\x00-\x1F\x7F]/g, "").trim();
}

export async function fetchDevice(serial) {
  if (!serial || typeof serial !== "string") {
    throw new Error("Invalid serial");
  }

  const provider = getReadOnlyProvider();
  const contract = new ethers.Contract(contractAddress, contractABI, provider);

  try {
    // 1) getAllSerials -> normalize -> check existence
    const allSerials = await contract.getAllSerials();
    const normalized = allSerials
          .map((s) => sanitizeString(s).toLowerCase())
          .filter((s) => s && s.length > 0);
    const target = sanitizeString(serial).toLowerCase();
    const existsInList = normalized.includes(target);

    // If not in list, return early
    if (!existsInList) {
      return {
        serial,
        existsInList: false,
        valid: false,
        manufacturer: "",
        productionDate: "",
        productionLocation: "",
        ipfsHash: "",
        deviceOwner: "", // ADD THIS
      };
    }

    // 2) Try verifyDevice() first — preferred single-call source of truth
    let validFlag = false;
    let manufacturer = "";
    let productionDate = "";
    let productionLocation = "";
    let ipfsHash = "";
    let deviceOwner = ""; // ADD THIS

    try {
      const verified = await contract.verifyDevice(serial);
      console.log("🔍 verifyDevice raw result for", serial, "=>", verified);
      
      // FIXED: Properly handle the returned object structure
      if (verified && typeof verified === "object") {
        // The verified object should have the fields from your ABI
        const serialNumber = sanitizeString(verified.serialNumber);
        productionDate = sanitizeString(verified.productionDate);
        productionLocation = sanitizeString(verified.productionLocation);
        manufacturer = sanitizeString(verified.manufacturer);
        ipfsHash = sanitizeString(verified.ipfsHash);
        validFlag = Boolean(verified.valid);
        deviceOwner = verified.deviceOwner || ""; // ADD THIS - don't sanitize address
        
        console.log("✅ Parsed verifyDevice:", {
          serialNumber,
          productionDate,
          productionLocation,
          manufacturer,
          ipfsHash,
          valid: validFlag,
          deviceOwner // ADD THIS
        });
      } else {
        console.warn("verifyDevice returned unexpected format:", verified);
        validFlag = false;
      }
    } catch (verifyErr) {
      // verifyDevice might revert on some contract versions — warn and fall back
      console.warn("verifyDevice() failed, falling back to isRegistered/getDevice/logs:", verifyErr);

      // Fallback A: try isRegistered() to get boolean valid
      try {
        validFlag = Boolean(await contract.isRegistered(serial));
      } catch (isRegErr) {
        console.warn("isRegistered() call failed — treating as false:", isRegErr);
        validFlag = false;
      }

      // Fallback B: try getDevice() for details (may revert; we catch and will fallback to logs)
      try {
        const details = await contract.getDevice(serial);
        // details may be array-like or object-like
        productionDate = sanitizeString(details[1] ?? details.productionDate);
        productionLocation = sanitizeString(details[2] ?? details.productionLocation);
        manufacturer = sanitizeString(details[3] ?? details.manufacturer);
        ipfsHash = sanitizeString(details[4] ?? details.ipfsHash);
        deviceOwner = details[5] ?? details.deviceOwner ?? ""; // ADD THIS
      } catch (getDevErr) {
        console.warn("fetchDevice: getDevice() failed — falling back to event logs:", getDevErr);

        try {
          // ✅ ethers v6 syntax (no .utils)
          const iface = new ethers.Interface(contractABI);

          // compute event topic for DeviceRegistered
          const eventTopic = iface.getEventTopic("DeviceRegistered");
          const topicSerial = ethers.keccak256(ethers.toUtf8Bytes(serial));

          const logs = await provider.getLogs({
            address: contractAddress,
            topics: [eventTopic, topicSerial],
            fromBlock: 0,
            toBlock: "latest",
          });

          if (logs && logs.length > 0) {
            const log = logs[logs.length - 1];
            const parsed = iface.parseLog(log);

            manufacturer = sanitizeString(parsed.args.manufacturer ?? parsed.args[1]);
            productionDate = sanitizeString(parsed.args.date ?? parsed.args[2]);
            productionLocation = sanitizeString(parsed.args.location ?? parsed.args[3]);
            deviceOwner = parsed.args.owner ?? parsed.args[4] ?? ""; // ADD THIS
            console.log("✅ Parsed DeviceRegistered log for", serial, parsed.args);
          } else {
            console.warn("No DeviceRegistered logs found for", serial);
          }
        } catch (logErr) {
          console.warn("Fallback log parsing failed:", logErr);
        }
      }
    }

        // Return the final result with deviceOwner
        return {
          serial,
          existsInList: true,
          valid: validFlag,
          manufacturer,
          productionDate,
          productionLocation,
          ipfsHash,
          deviceOwner, // ADD THIS
        };
      } catch (err) {
        console.error("fetchDevice() outer error:", err);
        const msg = err?.message || "";
        if (msg.includes("missing revert data") || err?.code === "CALL_EXCEPTION") {
          return {
            serial,
            existsInList: false,
            valid: false,
            manufacturer: "",
            productionDate: "",
            productionLocation: "",
            ipfsHash: "",
            deviceOwner: "", // ADD THIS
          };
        }
        throw new Error("Failed to fetch device details: " + msg);
      }
    }

// ================== Registration helper ==================
export async function registerNewDevice(device) {
  const { signer } = await getProviderAndSigner();
  if (!signer) throw new Error("MetaMask not connected");

  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  try {
    // Your contract's registerDevice signature expects ipfsHash last.
    // We keep ipfsHash empty string when not provided.
    const tx = await contract.registerDevice(
      device.serialNumber,
      device.productionDate,
      device.productionLocation,
      device.manufacturer,
      device.ipfsHash || "" // empty if not given
    );
    await tx.wait();
    return tx;
  } catch (err) {
    console.error("registerDevice failed:", err);
    throw err;
  }
}

// ================== CORRECTED: Assign Ownership helper ==================
export async function assignOwnership(serial, newOwner) {
  const { signer } = await getProviderAndSigner();
  if (!signer) throw new Error("MetaMask not connected");

  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  try {
    console.log("Assigning ownership for serial:", serial, "to:", newOwner);
    // CORRECTED: Using actual function name from contract
    const tx = await contract.assignDeviceTo(serial, newOwner);
    await tx.wait();
    console.log("✅ Ownership assigned successfully");
    return tx;
  } catch (err) {
    console.error("assignOwnership failed:", err);
    throw err;
  }
}

// ================== CORRECTED: Transfer Ownership helper ==================
export async function transferOwnership(serial, newOwner) {
  const { signer } = await getProviderAndSigner();
  if (!signer) throw new Error("MetaMask not connected");

  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  try {
    console.log("Transferring ownership for serial:", serial, "to:", newOwner);
    // CORRECTED: Using actual function name from contract
    const tx = await contract.transferDeviceOwnership(serial, newOwner);
    await tx.wait();
    console.log("✅ Ownership transferred successfully");
    return tx;
  } catch (err) {
    console.error("transferOwnership failed:", err);
    throw err;
  }
}