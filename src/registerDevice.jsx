// src/pages/VerifyDevice.jsx
import React, { useState } from "react";
import { fetchDevice } from "../contractConfig";

export default function VerifyDevice() {
  const [serialNumber, setSerialNumber] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const verifyDevice = async () => {
    if (!serialNumber.trim()) {
      alert("Please enter a serial number");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const device = await fetchDevice(serialNumber);
      if (device.valid) {
        setResult({ success: true, message: "✅ Verification successful!" });
      } else {
        setResult({ success: false, message: "❌ Device not found or invalid." });
      }
    } catch (err) {
      console.error("verifyDevice error:", err);
      setResult({ success: false, message: "❌ Verification failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="bg-white shadow-md rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-2">Verify Device</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Publicly accessible. For further information, visit{" "}
          <a
            href="https://sepolia.etherscan.io/address/0x93ED569271192b67F33e9D15f42b02Fe15c2F5f8#readContract"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            this Etherscan link
          </a>{" "}
          for behind-the-scenes authentication.
        </p>

        <input
          type="text"
          placeholder="Enter Serial Number"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          className="border border-gray-300 rounded-lg p-3 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-green-400"
        />

        <button
          onClick={verifyDevice}
          disabled={loading}
          className="w-full bg-green-500 text-white font-semibold py-3 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

        {result && (
          <p
            className={`mt-4 text-center font-medium ${
              result.success ? "text-green-600" : "text-red-600"
            }`}
          >
            {result.message}
          </p>
        )}
      </div>
    </div>
  );
}
