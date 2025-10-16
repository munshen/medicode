import { useState } from "react";
import { getProviderAndSigner, registerNewDevice } from "../contractConfig";

function RegisterDevicePage() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [serialNumber, setSerialNumber] = useState("");
  const [productionDate, setProductionDate] = useState("");
  const [productionLocation, setProductionLocation] = useState("");
  const [manufacturer, setManufacturer] = useState("");

  const connectWallet = async () => {
    const { signer } = await getProviderAndSigner();
    if (signer) setWalletConnected(true);
    else setErrorMsg("MetaMask not detected or connection failed.");
  };

  const handleRegister = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!serialNumber || !productionDate || !productionLocation || !manufacturer) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    const newDevice = {
      serialNumber,
      productionDate,
      productionLocation,
      manufacturer,
      // No IPFS field here! handled automatically
    };

    try {
      setLoading(true);
      await registerNewDevice(newDevice);
      setSuccessMsg(`Device "${serialNumber}" registered successfully!`);
      setSerialNumber("");
      setProductionDate("");
      setProductionLocation("");
      setManufacturer("");
    } catch (err) {
      console.error(err);
      setErrorMsg("Registration failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
      {!walletConnected ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <>
          <h2>Register New Device</h2>
          {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
          {successMsg && <p style={{ color: "green" }}>{successMsg}</p>}

          <input placeholder="Serial Number" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
          <input placeholder="Production Date" value={productionDate} onChange={(e) => setProductionDate(e.target.value)} />
          <input placeholder="Production Location" value={productionLocation} onChange={(e) => setProductionLocation(e.target.value)} />
          <input placeholder="Manufacturer" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />

          <button onClick={handleRegister} disabled={loading}>
            {loading ? "Registering..." : "Register Device"}
          </button>
        </>
      )}
    </div>
  );
}

export default RegisterDevicePage;
