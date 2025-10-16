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
  const [transferTo, setTransferTo] = useState("");
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
      const userAddr = await signer.getAddress();
      setAccount(userAddr);
      setContractSigner(new ethers.Contract(contractAddress, contractABI, signer));
      setStatusMsg("✅ Connected with MetaMask (Sepolia)");
    } catch (err) {
      console.error(err);
      alert("Failed to connect MetaMask");
    }
  }

  // ------- Fetch all devices (only valid) -------
  async function fetchAllDevices() {
    try {
      const provider = getReadOnlyProvider();
      const contractRO = new ethers.Contract(contractAddress, contractABI, provider);
      const serials = await contractRO.getAllSerials();
      const validDevices = [];
      for (const s of serials) {
        const d = await contractRO.getDevice(s);
        if (d[4]) validDevices.push(s);
      }
      setDevices(validDevices);
    } catch (err) {
      console.error("fetchAllDevices:", err);
    }
  }

  // ------- Verify -------
  async function verify(serialNumber) {
    try {
      const provider = getReadOnlyProvider();
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      const res = await contract.verifyDevice(serialNumber);
      setInfo({
        serial: res[0],
        date: res[1],
        location: res[2],
        manufacturer: res[3],
        valid: res[4],
        owner: res[5],
      });
    } catch (err) {
      console.error("verify:", err);
    }
  }

  // ------- Register -------
  async function registerDevice() {
    if (!contractSigner) return alert("Connect MetaMask first.");
    try {
      setStatusMsg("⏳ Registering device...");
      const tx = await contractSigner.registerDevice(
        newDevice.serialNumber,
        newDevice.productionDate,
        newDevice.productionLocation,
        newDevice.manufacturer,
      );
      await tx.wait();
      setStatusMsg("✅ Device registered!");
      await fetchAllDevices();
    } catch (err) {
      console.error("registerDevice:", err);
      setStatusMsg("❌ Registration failed");
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
      await fetchAllDevices(); // refresh list
    } catch (err) {
      console.error("revokeDevice:", err);
      setStatusMsg("❌ Revoke failed");
    }
  }

  // ------- Assign to buyer -------
  async function assignToBuyer() {
    if (!contractSigner) return alert("Connect MetaMask first.");
    try {
      setStatusMsg("⏳ Assigning device...");
      const tx = await contractSigner.assignDeviceTo(serial, transferTo);
      await tx.wait();
      setStatusMsg("✅ Device assigned!");
      await fetchAllDevices();
    } catch (err) {
      console.error("assignToBuyer:", err);
      setStatusMsg("❌ Assignment failed");
    }
  }

  // ------- Transfer ownership -------
  async function transferOwnership() {
    if (!contractSigner) return alert("Connect MetaMask first.");
    try {
      setStatusMsg("⏳ Transferring ownership...");
      const tx = await contractSigner.transferDeviceOwnership(serial, transferTo);
      await tx.wait();
      setStatusMsg("✅ Ownership transferred!");
      await fetchAllDevices();
    } catch (err) {
      console.error("transferOwnership:", err);
      setStatusMsg("❌ Transfer failed");
    }
  }

  useEffect(() => {
    fetchAllDevices();
  }, []);

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "system-ui",
        background: "#f0fdf4",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ color: "#065f46" }}>🩺 MediCode — Public Verification</h1>

      <div style={{ marginBottom: 16 }}>
        <button
          onClick={connectWallet}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            background: "#16a34a",
            color: "white",
            border: "none",
          }}
        >
          {account
            ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
            : "Connect MetaMask"}
        </button>
        <span style={{ marginLeft: 10, color: "#065f46" }}>{statusMsg}</span>
      </div>

      {/* Register */}
      <div style={{ background: "white", padding: 16, borderRadius: 12, marginBottom: 20 }}>
        <h2>Register New Device</h2>
        {Object.keys(newDevice).map((key) => (
          <input
            key={key}
            placeholder={key}
            value={newDevice[key]}
            onChange={(e) => setNewDevice({ ...newDevice, [key]: e.target.value })}
            style={{
              display: "block",
              width: "100%",
              marginBottom: 8,
              padding: 8,
              borderRadius: 6,
              border: "1px solid #d1fae5",
            }}
          />
        ))}
        <button
          onClick={registerDevice}
          style={{
            background: "#10b981",
            color: "white",
            padding: "8px 12px",
            borderRadius: 8,
            border: "none",
          }}
        >
          Register
        </button>
      </div>

      {/* Verify */}
      <div style={{ background: "white", padding: 16, borderRadius: 12, marginBottom: 20 }}>
        <h2>Verify Device</h2>
        <input
          placeholder="Serial Number"
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 6,
            border: "1px solid #d1fae5",
            marginBottom: 8,
          }}
        />
        <button
          onClick={() => verify(serial)}
          style={{
            background: "#2563eb",
            color: "white",
            padding: "8px 12px",
            borderRadius: 8,
            border: "none",
          }}
        >
          Verify
        </button>

        {info && (
          <div style={{ marginTop: 10 }}>
            <p>
              <strong>Serial:</strong> {info.serial}
            </p>
            <p>
              <strong>Valid:</strong> {info.valid ? "✅ Authentic" : "❌ Revoked"}
            </p>
            <p>
              <strong>Owner:</strong> {info.owner}
            </p>
          </div>
        )}
      </div>

      {/* All valid devices */}
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
                  style={{
                    marginLeft: 8,
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    padding: "4px 8px",
                    borderRadius: 6,
                  }}
                >
                  Verify
                </button>
                {account && (
                  <button
                    onClick={() => revokeDevice(d)}
                    style={{
                      marginLeft: 8,
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: 6,
                    }}
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
