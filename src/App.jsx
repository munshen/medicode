// src/App.jsx
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contractAddress, contractABI, getReadOnlyProvider, getProviderAndSigner } from "./contractConfig";

function App() {
  const [account, setAccount] = useState(null); // user connected via MetaMask
  const [contractSigner, setContractSigner] = useState(null); // contract connected with signer (for writes)
  const [serial, setSerial] = useState("");
  const [info, setInfo] = useState(null);
  const [transferTo, setTransferTo] = useState("");
  const [newDevice, setNewDevice] = useState({
    serialNumber: "",
    productionDate: "",
    productionLocation: "",
    manufacturer: "",
    ipfsHash: "",
  });
  const [devices, setDevices] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");

  // ------- Connect MetaMask for write operations -------
  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask not detected — to write (register/assign/transfer) you need MetaMask. Public verification works without MetaMask.");
      return;
    }
    try {
      const { provider, signer } = await getProviderAndSigner();
      if (!provider || !signer) return;

      const userAddr = await signer.getAddress();
      setAccount(userAddr);

      // contract instance with signer for write operations
      const contractWithSigner = new ethers.Contract(contractAddress, contractABI, signer);
      setContractSigner(contractWithSigner);

      setStatusMsg("Connected with MetaMask for write operations. Make sure your MetaMask network is Sepolia for writes.");
    } catch (err) {
      console.error("connectWallet:", err);
      alert("Connection failed: " + (err.message || err));
    }
  }

  // ------- Public (read-only) verification using read-only provider -------
  async function publicVerify() {
    setStatusMsg("Performing public verification...");
    setInfo(null);
    try {
      const provider = getReadOnlyProvider();
      const contractRO = new ethers.Contract(contractAddress, contractABI, provider);
      const result = await contractRO.verifyDevice(serial);
      // result: [serial, date, location, manufacturer, ipfs, valid, owner]
      setInfo({
        serial: result[0],
        productionDate: result[1],
        productionLocation: result[2],
        manufacturer: result[3],
        ipfsHash: result[4],
        valid: result[5],
        deviceOwner: result[6],
      });
      setStatusMsg("Public verification complete.");
    } catch (err) {
      console.error("publicVerify:", err);
      setStatusMsg("Public verification failed. Check console for details.");
    }
  }

  // ------- Verify using signed contract (when connected) -------
  async function verifyDevice() {
    setStatusMsg("Verifying (using connected node/MetaMask)...");
    if (!contractSigner) {
      // fallback to public verify
      await publicVerify();
      return;
    }
    try {
      const result = await contractSigner.verifyDevice(serial);
      setInfo({
        serial: result[0],
        productionDate: result[1],
        productionLocation: result[2],
        manufacturer: result[3],
        ipfsHash: result[4],
        valid: result[5],
        deviceOwner: result[6],
      });
      setStatusMsg("Verification via connected account complete.");
    } catch (err) {
      console.error("verifyDevice:", err);
      setStatusMsg("Verification failed (signed).");
    }
  }

  // ------- Manufacturer: register device (requires signer) -------
  async function registerDevice() {
    if (!contractSigner) return alert("Connect MetaMask (manufacturer account) first to register devices.");
    try {
      setStatusMsg("Sending registerDevice transaction...");
      const tx = await contractSigner.registerDevice(
        newDevice.serialNumber,
        newDevice.productionDate,
        newDevice.productionLocation,
        newDevice.manufacturer,
        newDevice.ipfsHash
      );
      await tx.wait();
      setStatusMsg("Device registered successfully.");
      // refresh device list (public)
      await fetchAllDevices();
    } catch (err) {
      console.error("registerDevice:", err);
      setStatusMsg("Register failed. See console.");
      alert("Register failed: " + (err.message || err));
    }
  }

  // ------- Manufacturer: assign to buyer -------
  async function assignToBuyer() {
    if (!contractSigner) return alert("Connect MetaMask (manufacturer) first to assign devices.");
    try {
      setStatusMsg("Sending assignDeviceTo transaction...");
      const tx = await contractSigner.assignDeviceTo(serial, transferTo);
      await tx.wait();
      setStatusMsg("Device assigned successfully.");
      await verifyDevice();
      await fetchAllDevices();
    } catch (err) {
      console.error("assignToBuyer:", err);
      setStatusMsg("Assign failed. See console.");
      alert("Assign failed: " + (err.message || err));
    }
  }

  // ------- Owner: transfer device to another address -------
  async function transferOwnership() {
    if (!contractSigner) return alert("Connect MetaMask and use the current device owner account to transfer.");
    try {
      setStatusMsg("Sending transferDeviceOwnership transaction...");
      const tx = await contractSigner.transferDeviceOwnership(serial, transferTo);
      await tx.wait();
      setStatusMsg("Ownership transferred.");
      await verifyDevice();
      await fetchAllDevices();
    } catch (err) {
      console.error("transferOwnership:", err);
      setStatusMsg("Transfer failed. See console.");
      alert("Transfer failed: " + (err.message || err));
    }
  }

  // ------- Fetch all serials publicly (read-only) -------
  async function fetchAllDevices() {
    try {
      const provider = getReadOnlyProvider();
      const contractRO = new ethers.Contract(contractAddress, contractABI, provider);
      const serials = await contractRO.getAllSerials();
      setDevices(serials || []);
    } catch (err) {
      console.error("fetchAllDevices:", err);
    }
  }

  useEffect(() => {
    // Always fetch devices for public listing when app loads
    fetchAllDevices();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, Arial, sans-serif", background: "#f0fdf4", minHeight: "100vh" }}>
      <h1 style={{ color: "#065f46", marginBottom: 16 }}>🩺 MediCode — public verification</h1>

      <div style={{ marginBottom: 12 }}>
        <button onClick={connectWallet} style={{ padding: "8px 14px", borderRadius: 8, background: "#16a34a", color: "white", border: "none" }}>
          {account ? `Connected: ${account.slice(0,6)}...${account.slice(-4)}` : "Connect MetaMask (for register/assign/transfer)"}
        </button>
        <span style={{ marginLeft: 12, color: "#065f46" }}>{statusMsg}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Left column: Register (manufacturer) */}
        <div style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}>
          <h2>Register New Device (Manufacturer)</h2>
          {Object.keys(newDevice).map((k) => (
            <input
              key={k}
              value={newDevice[k]}
              placeholder={k.replace(/([A-Z])/g, " $1")}
              onChange={(e)=> setNewDevice({...newDevice, [k]: e.target.value })}
              style={{ width: "100%", marginBottom: 8, padding: 8, borderRadius: 6, border: "1px solid #d1fae5" }}
            />
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={registerDevice} style={{ background: "#10b981", color: "white", padding: "8px 12px", borderRadius: 8, border: "none" }}>
              Register (requires MetaMask)
            </button>
            <button onClick={() => {
              // quick-populate IPFS dummy for local testing
              setNewDevice({...newDevice, ipfsHash: "QmTestHash123"});
            }} style={{ padding: "8px 12px", borderRadius: 8 }}>
              Fill test IPFS
            </button>
          </div>
        </div>

        {/* Right column: Verify / Transfer */}
        <div style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}>
          <h2>Verify Device (public)</h2>
          <input placeholder="Enter serial number" value={serial} onChange={(e)=>setSerial(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8, borderRadius: 6, border: "1px solid #d1fae5" }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button onClick={publicVerify} style={{ background: "#3b82f6", color: "white", padding: "8px 12px", borderRadius: 8, border: "none" }}>
              Public Verify (no MetaMask)
            </button>
            <button onClick={verifyDevice} style={{ background: "#2563eb", color: "white", padding: "8px 12px", borderRadius: 8, border: "none" }}>
              Verify (MetaMask)
            </button>
          </div>

          {info ? (
            <div style={{ marginTop: 8 }}>
              <p><strong>Serial:</strong> {info.serial}</p>
              <p><strong>Production Date:</strong> {info.productionDate}</p>
              <p><strong>Location:</strong> {info.productionLocation}</p>
              <p><strong>Manufacturer:</strong> {info.manufacturer}</p>
              <p><strong>IPFS:</strong> {info.ipfsHash ? <a href={`https://ipfs.io/ipfs/${info.ipfsHash}`} target="_blank" rel="noreferrer">View</a> : "—"}</p>
              <p><strong>Valid:</strong> {info.valid ? "✅ Authentic" : "❌ Revoked or Invalid"}</p>
              <p><strong>Owner:</strong> {info.deviceOwner === "0x0000000000000000000000000000000000000000" ? "Unassigned" : info.deviceOwner}</p>
            </div>
          ) : (
            <p style={{ color: "#6b7280" }}>No verification result yet.</p>
          )}

          <hr style={{ margin: "12px 0" }} />

          <h3>Assign / Transfer</h3>
          <input placeholder="Recipient address (0x...)" value={transferTo} onChange={(e)=>setTransferTo(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8, borderRadius: 6, border: "1px solid #fde68a" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={assignToBuyer} style={{ background: "#f59e0b", color: "white", padding: "8px 12px", borderRadius: 8, border: "none" }}>
              Assign to Buyer (manufacturer)
            </button>
            <button onClick={transferOwnership} style={{ background: "#7c3aed", color: "white", padding: "8px 12px", borderRadius: 8, border: "none" }}>
              Transfer Ownership (owner)
            </button>
          </div>
        </div>
      </div>

      {/* Registered devices list */}
      <div style={{ marginTop: 18 }}>
        <h3>All Registered Devices (public list)</h3>
        {devices.length === 0 ? <p>No devices yet.</p> : (
          <ul>
            {devices.map((d, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {d}{" "}
                <button onClick={() => { setSerial(d); publicVerify(); }} style={{ marginLeft: 8, background: "#3b82f6", color: "white", border: "none", padding: "4px 8px", borderRadius: 6 }}>
                  Verify
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer style={{ marginTop: 28, color: "#065f46" }}>
        <p>Note: Public verify uses Sepolia RPC; no wallet required. To register/assign/transfer you must connect MetaMask and be using Sepolia testnet.</p>
      </footer>
    </div>
  );
}

export default App;
