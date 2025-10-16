// src/App.jsx
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  contractAddress,
  contractABI,
  getReadOnlyProvider,
  getProviderAndSigner,
} from "./contractConfig";

function App() {
  const [account, setAccount] = useState(null);
  const [contractSigner, setContractSigner] = useState(null);
  const [serial, setSerial] = useState("");
  const [info, setInfo] = useState(null);
  const [newDevice, setNewDevice] = useState({
    serialNumber: "",
    productionDate: "",
    productionLocation: "",
    manufacturer: "",
  });
  const [devices, setDevices] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");

  // ------- Connect MetaMask -------
  async function connectWallet() {
    try {
      const { provider, signer } = await getProviderAndSigner();
      if (!signer) throw new Error("MetaMask not connected");
      const userAddr = await signer.getAddress();
      setAccount(userAddr);
      setContractSigner(new ethers.Contract(contractAddress, contractABI, signer));
      setStatusMsg("✅ Connected with MetaMask (Sepolia)");
    } catch (err) {
      console.error("MetaMask connection error:", err);
      alert("Failed to connect MetaMask. Check network & install MetaMask.");
    }
  }

  // ------- Fetch all devices -------
  async function fetchAllDevices() {
    try {
      const provider = getReadOnlyProvider();
      const contractRO = new ethers.Contract(contractAddress, contractABI, provider);
      const serials = await contractRO.getAllSerials();
      const validDevices = [];
      for (const s of serials) {
        const d = await contractRO.getDevice(s);
        if (d[4]) validDevices.push(s); // d[4] is `valid` in Solidity
      }
      setDevices(validDevices);
    } catch (err) {
      console.error("fetchAllDevices error:", err);
    }
  }

  // ------- Verify device -------
  async function verify(serialNumber) {
    try {
      const provider = getReadOnlyProvider();
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      const d = await contract.getDevice(serialNumber);
      setInfo({
        serial: d[0],
        date: d[1],
        location: d[2],
        manufacturer: d[3],
        valid: d[4],
      });
    } catch (err) {
      console.error("verify error:", err);
      setInfo(null);
      setStatusMsg("❌ Verification failed");
    }
  }

  // ------- Register device -------
  async function registerDevice() {
    if (!contractSigner) return alert("Connect MetaMask first.");
    try {
      setStatusMsg("⏳ Registering device...");
      const tx = await contractSigner.registerDevice(
        newDevice.serialNumber,
        newDevice.productionDate,
        newDevice.productionLocation,
        newDevice.manufacturer,
        ""
      );
      await tx.wait();
      setStatusMsg("✅ Device registered successfully!");
      await fetchAllDevices();
    } catch (err) {
      console.error("Full registration error:", err);
      setStatusMsg("❌ Registration failed: " + (err.reason || err.message || "Unknown error"));
    }
  }

  // ------- Revoke device (owner only) -------
  async function revokeDevice(serialNumber) {
    if (!contractSigner) return alert("Connect MetaMask as contract owner first.");
    try {
      setStatusMsg("⏳ Revoking device...");
      const tx = await contractSigner.revokeDevice(serialNumber);
      await tx.wait();
      setStatusMsg(`🚫 Device ${serialNumber} revoked`);
      await fetchAllDevices();
    } catch (err) {
      console.error("revokeDevice error:", err);
      setStatusMsg("❌ Revoke failed: " + (err.reason || err.message || "Unknown error"));
    }
  }

  useEffect(() => {
    fetchAllDevices();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui", background: "#f0fdf4", minHeight: "100vh" }}>
      <h1 style={{ color: "#065f46" }}>🩺 MediCode — Public Verification</h1>

      <div style={{ marginBottom: 16 }}>
        <button
          onClick={connectWallet}
          style={{ padding: "8px 14px", borderRadius: 8, background: "#16a34a", color: "white", border: "none" }}
        >
          {account ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : "Connect MetaMask"}
        </button>
        <span style={{ marginLeft: 10, color: "#065f46" }}>{statusMsg}</span>
      </div>

      {/* Register Device */}
      <div style={{ background: "white", padding: 16, borderRadius: 12, marginBottom: 20 }}>
        <h2>Register New Device</h2>
        {Object.keys(newDevice).map((key) => (
          <input
            key={key}
            placeholder={key}
            value={newDevice[key]}
            onChange={(e) => setNewDevice({ ...newDevice, [key]: e.target.value })}
            style={{ display: "block", width: "100%", marginBottom: 8, padding: 8, borderRadius: 6, border: "1px solid #d1fae5" }}
          />
        ))}
        <button
          onClick={registerDevice}
          style={{ background: "#10b981", color: "white", padding: "8px 12px", borderRadius: 8, border: "none" }}
        >
          Register
        </button>
      </div>

      {/* Verify Device */}
      <div style={{ background: "white", padding: 16, borderRadius: 12, marginBottom: 20 }}>
        <h2>Verify Device</h2>
        <input
          placeholder="Serial Number"
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1fae5", marginBottom: 8 }}
        />
        <button
          onClick={() => verify(serial)}
          style={{ background: "#2563eb", color: "white", padding: "8px 12px", borderRadius: 8, border: "none" }}
        >
          Verify
        </button>

        {info && (
          <div style={{ marginTop: 10 }}>
            <p><strong>Serial:</strong> {info.serial}</p>
            <p><strong>Date:</strong> {info.date}</p>
            <p><strong>Location:</strong> {info.location}</p>
            <p><strong>Manufacturer:</strong> {info.manufacturer}</p>
            <p><strong>Valid:</strong> {info.valid ? "✅ Authentic" : "❌ Revoked"}</p>
          </div>
        )}
      </div>

      {/* All Valid Devices */}
      <div style={{ background: "white", padding: 16, borderRadius: 12 }}>
        <h2>All Valid Devices</h2>
        {devices.length === 0 ? (
          <p>No valid devices found.</p>
        ) : (
          <ul>
            {devices.map((d, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                {d}
                <button
                  onClick={() => verify(d)}
                  style={{ marginLeft: 8, background: "#3b82f6", color: "white", border: "none", padding: "4px 8px", borderRadius: 6 }}
                >
                  Verify
                </button>
                {account && (
                  <button
                    onClick={() => revokeDevice(d)}
                    style={{ marginLeft: 8, background: "#dc2626", color: "white", border: "none", padding: "4px 8px", borderRadius: 6 }}
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
