// src/pages/VerifyDevice.jsx
import React, { useState } from "react";
import { fetchDevice } from "../contractConfig";

export default function VerifyDevice() {
  const [serial, setSerial] = useState("");
  const [status, setStatus] = useState(null); // { type: "authentic"|"revoked"|"invalid"|"error", message, details? }
  const [loading, setLoading] = useState(false);

  async function verifyDeviceHandler() {
    setStatus(null);
    if (!serial || !serial.trim()) {
      setStatus({ type: "error", message: "Please enter a serial number." });
      return;
    }

    setLoading(true);
    try {
      console.log("Calling fetchDevice for:", serial);
      const result = await fetchDevice(serial.trim());
      console.log("fetchDevice returned:", result);

      // result: { serial, existsInList, valid, manufacturer, productionDate, productionLocation, ipfsHash }
      if (!result || result.existsInList === false) {
        setStatus({ type: "invalid", message: "❌ Invalid Serial Number — not registered on-chain." });
        return;
      }

      if (result.valid) {
        setStatus({
          type: "authentic",
          message: "✅ Authentic — device is registered and active.",
          details: {
            manufacturer: result.manufacturer || "—",
            productionDate: result.productionDate || "—",
            productionLocation: result.productionLocation || "—",
            ipfsHash: result.ipfsHash || "—",
          },
        });
      } else {
        setStatus({
          type: "revoked",
          message: "⚠️ Revoked — device was registered but has been invalidated.",
          details: {
            manufacturer: result.manufacturer || "—",
            productionDate: result.productionDate || "—",
            productionLocation: result.productionLocation || "—",
            ipfsHash: result.ipfsHash || "—",
          },
        });
      }
    } catch (err) {
      console.error("verifyDeviceHandler error:", err);
      setStatus({
        type: "error",
        message: "Verification failed. See console for details.",
        details: err?.message || String(err),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 20 }}>
      <h2>Verify Device</h2>
      <p style={{ color: "#065f46" }}>
        Publicly accessible. For further information, visit{" "}
        <a
          href="https://sepolia.etherscan.io/address/0x93ED569271192b67F33e9D15f42b02Fe15c2F5f8#readContract"
          target="_blank"
          rel="noreferrer"
        >
          Etherscan
        </a>{" "}
        for behind-the-scenes authentication.
      </p>

      <input
        type="text"
        value={serial}
        onChange={(e) => setSerial(e.target.value)}
        placeholder="Enter serial number"
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
      />

      <button
        onClick={verifyDeviceHandler}
        disabled={loading}
        style={{
          padding: "8px 16px",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        {loading ? "Verifying..." : "Verify"}
      </button>

      {status && (
        <div style={{ marginTop: 20 }}>
          {status.type === "authentic" && (
            <>
              <p style={{ color: "green" }}>{status.message}</p>
              <p><strong>Manufacturer:</strong> {status.details.manufacturer}</p>
              <p><strong>Date:</strong> {status.details.productionDate}</p>
              <p><strong>Location:</strong> {status.details.productionLocation}</p>
              <p><strong>IPFS:</strong> {status.details.ipfsHash}</p>
            </>
          )}
          {status.type === "revoked" && (
            <>
              <p style={{ color: "#b45309" }}>{status.message}</p>
              <p><strong>Manufacturer:</strong> {status.details.manufacturer}</p>
              <p><strong>Date:</strong> {status.details.productionDate}</p>
              <p><strong>Location:</strong> {status.details.productionLocation}</p>
              <p><strong>IPFS:</strong> {status.details.ipfsHash}</p>
            </>
          )}
          {status.type === "invalid" && <p style={{ color: "red" }}>{status.message}</p>}
          {status.type === "error" && (
            <>
              <p style={{ color: "darkred" }}>{status.message}</p>
              {status.details && <pre style={{ background: "#f8d7da", padding: 10 }}>{status.details}</pre>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
