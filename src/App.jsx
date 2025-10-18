// src/App.jsx
import { useState } from "react";
import { fetchDevice, registerNewDevice, getProviderAndSigner } from "./contractConfig";

function App() {
  const [account, setAccount] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [newDevice, setNewDevice] = useState({
    serialNumber: "",
    productionDate: "",
    productionLocation: "",
    manufacturer: "",
  });
  const [serial, setSerial] = useState("");
  const [info, setInfo] = useState(null);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);

  // Connect MetaMask (for writes)
  async function connectWallet() {
    try {
      const { signer } = await getProviderAndSigner();
      if (!signer) throw new Error("MetaMask not connected");
      const addr = await signer.getAddress();
      setAccount(addr);
      setStatusMsg("✅ Connected with MetaMask (Sepolia)");
    } catch (err) {
      console.error("connectWallet error:", err);
      setStatusMsg("❌ MetaMask connection failed");
      alert("Connect MetaMask to perform write operations.");
    }
  }

  // Register device (uses registerNewDevice helper which handles 4/5 arg)
  async function registerDevice() {
    setInfo(null);
    setStatusMsg("");
    if (!newDevice.serialNumber) return alert("Serial is required");
    try {
      setLoadingRegister(true);
      setStatusMsg("⏳ Registering device...");
      await registerNewDevice(newDevice);
      setStatusMsg("✅ Device registered successfully!");
    } catch (err) {
      console.error("registerDevice error:", err);
      setStatusMsg("❌ Registration failed: " + (err?.reason || err?.message || "Unknown"));
    } finally {
      setLoadingRegister(false);
    }
  }

  // ✅ Updated verifyDevice function
  async function verifyDevice(serialToVerify) {
    setInfo(null);
    setStatusMsg("");
    if (!serialToVerify || serialToVerify.trim() === "") {
      setStatusMsg("❌ Please enter a serial number.");
      return;
    }

    try {
      setLoadingVerify(true);
      setStatusMsg("⏳ Verifying...");
      console.log("Calling fetchDevice for:", serialToVerify);
      const d = await fetchDevice(serialToVerify);
      console.log("fetchDevice result:", d);

      // Determine validity case
      if (!d.existsInList) {
        setInfo({
          serial: serialToVerify,
          status: "invalid",
          message: "❌ Invalid Serial Number — not registered on-chain.",
        });
        setStatusMsg("❌ Invalid Serial Number");
      } else if (d.valid === true || d.valid === "true" || d.valid == 1) {
        setInfo({
          serial: serialToVerify,
          status: "authentic",
          manufacturer: d.manufacturer || "—",
          date: d.productionDate || "—",
          location: d.productionLocation || "—",
          message: "✅ Authentic — device is valid and active.",
        });
        setStatusMsg("✅ Authentic");
      } else {
        setInfo({
          serial: serialToVerify,
          status: "revoked",
          manufacturer: d.manufacturer || "—",
          date: d.productionDate || "—",
          location: d.productionLocation || "—",
          message: "⚠️ Revoked — device was registered but has been invalidated.",
        });
        setStatusMsg("⚠️ Revoked");
      }
    } catch (err) {
      console.error("verifyDevice error (full):", err);
      setInfo(null);
      setStatusMsg("❌ Verification failed: " + (err?.message || err));
    } finally {
      setLoadingVerify(false);
    }
  }

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
        <p style={{ fontSize: "0.9rem", color: "#065f46" }}>Requires MetaMask account</p>

        <input
          placeholder="Serial Number"
          value={newDevice.serialNumber}
          onChange={(e) => setNewDevice({ ...newDevice, serialNumber: e.target.value })}
          style={{ display: "block", width: "100%", marginBottom: 8, padding: 8, borderRadius: 6 }}
        />
        <input
          placeholder="Production Date"
          value={newDevice.productionDate}
          onChange={(e) => setNewDevice({ ...newDevice, productionDate: e.target.value })}
          style={{ display: "block", width: "100%", marginBottom: 8, padding: 8, borderRadius: 6 }}
        />
        <input
          placeholder="Production Location"
          value={newDevice.productionLocation}
          onChange={(e) => setNewDevice({ ...newDevice, productionLocation: e.target.value })}
          style={{ display: "block", width: "100%", marginBottom: 8, padding: 8, borderRadius: 6 }}
        />
        <input
          placeholder="Manufacturer"
          value={newDevice.manufacturer}
          onChange={(e) => setNewDevice({ ...newDevice, manufacturer: e.target.value })}
          style={{ display: "block", width: "100%", marginBottom: 8, padding: 8, borderRadius: 6 }}
        />

        <button
          onClick={registerDevice}
          disabled={loadingRegister}
          style={{ background: "#10b981", color: "white", padding: "8px 12px", borderRadius: 8, border: "none" }}
        >
          {loadingRegister ? "Registering..." : "Register"}
        </button>
      </div>

      {/* Verify Device */}
      <div style={{ background: "white", padding: 16, borderRadius: 12 }}>
        <h2>Verify Device</h2>
        <p style={{ fontSize: "0.9rem", color: "#065f46" }}>
          Publicly accessible. For further information, visit{" "}
          <a
            href="https://sepolia.etherscan.io/address/0x93ED569271192b67F33e9D15f42b02Fe15c2F5f8#readContract"
            target="_blank"
            rel="noopener noreferrer"
          >
            Etherscan
          </a>{" "}
          for behind-the-scenes authentication.
        </p>

        <input
          placeholder="Serial Number"
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1fae5", marginBottom: 8 }}
        />
        <button
          onClick={() => verifyDevice(serial)}
          disabled={loadingVerify}
          style={{ background: "#2563eb", color: "white", padding: "8px 12px", borderRadius: 8, border: "none" }}
        >
          {loadingVerify ? "Verifying..." : "Verify"}
        </button>

        {/* ✅ Updated info display */}
        {info && (
          <div style={{ marginTop: 10 }}>
            <p><strong>Serial:</strong> {info.serial}</p>

            {info.status === "authentic" && (
              <>
                <p style={{ color: "green" }}><strong>Status:</strong> {info.message}</p>
                <p><strong>Manufacturer:</strong> {info.manufacturer}</p>
                <p><strong>Date:</strong> {info.date}</p>
                <p><strong>Location:</strong> {info.location}</p>
              </>
            )}

            {info.status === "revoked" && (
              <>
                <p style={{ color: "#b45309" }}><strong>Status:</strong> {info.message}</p>
                <p><strong>Manufacturer:</strong> {info.manufacturer}</p>
                <p><strong>Date:</strong> {info.date}</p>
                <p><strong>Location:</strong> {info.location}</p>
              </>
            )}

            {info.status === "invalid" && (
              <>
                <p style={{ color: "red" }}><strong>Status:</strong> {info.message}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
