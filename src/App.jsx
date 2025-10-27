// src/App.jsx
import { useState } from "react";
import { getProviderAndSigner, fetchDevice, registerNewDevice } from "./contractConfig";

function App() {
  const [userType, setUserType] = useState(null); // null = login page, 'guest' = guest, 'loggedIn' = logged in
  const [account, setAccount] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

// Connect MetaMask and login - RESTRICTED to authorized addresses only
async function connectWallet() {
  try {
    const { signer } = await getProviderAndSigner();
    if (!signer) throw new Error("MetaMask not connected");
    const addr = await signer.getAddress();
    
    // List of authorized addresses (company rep + collaborators)
    const authorizedAddresses = [
      "0x9Da7d2CA5C22E3134653920B98a7C9d272706329", // Company representative
      // ADD MORE COLLABORATOR ADDRESSES HERE:
      // "0x1234567890123456789012345678901234567890", // Collaborator 1
      // "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", // Collaborator 2
    ];
    
    // Check if connected address is authorized
    const isAuthorized = authorizedAddresses.some(authorizedAddr => 
      authorizedAddr.toLowerCase() === addr.toLowerCase()
    );
    
    if (!isAuthorized) {
      throw new Error("Access denied. Only authorized company representatives can access this dashboard.");
    }
    
    setAccount(addr);
    setUserType('loggedIn');
    setStatusMsg("✅ Login successful! Welcome to the company dashboard.");
  } catch (err) {
    console.error("connectWallet error:", err);
    setStatusMsg("❌ " + err.message);
  }
}

  // Continue as guest
  function continueAsGuest() {
    setUserType('guest');
    setStatusMsg("");
  }

  // Render login page
  if (userType === null) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center",
        padding: 24,
        fontFamily: "system-ui"
      }}>
        {/* Title */}
        <h1 style={{ 
          color: "#0369a1", 
          fontSize: "clamp(2.5rem, 8vw, 3.5rem)", 
          fontWeight: "bold", 
          marginBottom: "0.5rem",
          textAlign: "center"
        }}>
          Glucoku
        </h1>
        
        {/* Subtitle */}
        <p style={{ 
          color: "#0c4a6e", 
          fontSize: "clamp(1.2rem, 4vw, 1.5rem)", 
          marginBottom: "clamp(2rem, 6vw, 3rem)",
          textAlign: "center"
        }}>
          Device Verification Site. Powered by Ethereum Sepolia.
        </p>

        {/* Login Section */}
        <div style={{ 
          background: "white", 
          padding: "clamp(1rem, 3vw, 1.5rem)", 
          borderRadius: "16px", 
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          width: "90%",
          maxWidth: "350px",
          margin: "0 auto"
        }}>
          <h2 style={{ color: "#0369a1", marginBottom: "1.5rem", textAlign: "center" }}>
            Login with MetaMask
          </h2>
          
          <button
            onClick={connectWallet}
            style={{ 
              width: "100%",
              padding: "12px", 
              borderRadius: "8px", 
              background: "#0369a1", 
              color: "white", 
              border: "none",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: "1rem"
            }}
          >
            Connect MetaMask (internal access)
          </button>

          <div style={{ textAlign: "center", color: "#64748b", marginBottom: "1rem" }}>
            or
          </div>

          <button
            onClick={continueAsGuest}
            style={{ 
              width: "100%",
              padding: "12px", 
              borderRadius: "8px", 
              background: "transparent", 
              color: "#0369a1", 
              border: "2px solid #0369a1",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Continue as User (public access)
          </button>

          {statusMsg && (
            <p style={{ 
              textAlign: "center", 
              marginTop: "1rem", 
              color: statusMsg.includes("✅") ? "#059669" : "#dc2626" 
            }}>
              {statusMsg}
            </p>
          )}

          {/* ADD THIS NEW SECTION */}
<p style={{ 
  textAlign: "center", 
  marginTop: "2rem", 
  color: "#64748b",
  fontSize: "0.9rem"
}}>
  How to Register a MetaMask Wallet?{" "}
  <a
    href="https://support.metamask.io/start/getting-started-with-metamask/"
    target="_blank"
    rel="noopener noreferrer"
    style={{ 
      color: "#0374b1ff", 
      textDecoration: "underline",
      fontWeight: "500"
    }}
  >
    Read more.
  </a>
</p>
        </div>
      </div>
    );
  }

  // Import and use your existing components based on user type
  if (userType === 'guest') {
    return <GuestApp />;
  } else if (userType === 'loggedIn') {
    return <LoggedInApp account={account} />;
  }
}

// Guest App - Only Verify Device
function GuestApp() {
  const [serial, setSerial] = useState("");
  const [info, setInfo] = useState(null);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

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
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
      padding: 24, 
      fontFamily: "system-ui" 
    }}>

{/* ADD BACK ARROW FOR GUEST */}
    <button
      onClick={() => window.location.reload()}
      style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        background: "none",
        border: "none",
        fontSize: "24px",
        cursor: "pointer",
        color: "#0369a1",
        padding: "8px",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background-color 0.2s"
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(3, 105, 161, 0.1)"}
      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
    >
      ←
    </button>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ color: "#0369a1", textAlign: "center", marginBottom: "2rem" }}>
          Dashboard - Public Access
        </h1>

        {/* Verify Device Section */}
        <div style={{ 
          background: "white", 
          padding: "2rem", 
          borderRadius: "12px", 
          marginBottom: "20px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
        }}>
          <h2 style={{ color: "#0369a1", marginBottom: "1rem" }}>Verify Device</h2>
          <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
            Publicly accessible. For further information, visit{" "}
            <a
              href="https://sepolia.etherscan.io/address/0x93ED569271192b67F33e9D15f42b02Fe15c2F5f8#readContract"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0369a1", textDecoration: "underline" }}
            >
              Etherscan
            </a>{" "}
            for behind-the-scenes authentication.
          </p>

          <input
            placeholder="Enter Serial Number"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "12px", 
              borderRadius: "8px", 
              border: "1px solid #cbd5e1",
              marginBottom: "1rem",
              fontSize: "1rem"
            }}
          />
          
          <button
            onClick={() => verifyDevice(serial)}
            disabled={loadingVerify}
            style={{ 
              background: "#0369a1", 
              color: "white", 
              padding: "12px 24px", 
              borderRadius: "8px", 
              border: "none",
              fontSize: "1rem",
              cursor: "pointer"
            }}
          >
            {loadingVerify ? "Verifying..." : "Verify Device"}
          </button>

          {statusMsg && (
            <p style={{ 
              marginTop: "1rem", 
              color: statusMsg.includes("✅") ? "#059669" : 
                    statusMsg.includes("⚠️") ? "#d97706" : "#dc2626" 
            }}>
              {statusMsg}
            </p>
          )}

          {/* Results Display */}
          {info && (
            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#f8fafc", borderRadius: "8px" }}>
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
                <p style={{ color: "red" }}><strong>Status:</strong> {info.message}</p>
              )}
            </div>
          )}

          {/* META MASK HELP LINK FOR GUEST PAGE */}
        <p style={{ 
          textAlign: "center", 
          marginTop: "2rem", 
          color: "#64748b",
          fontSize: "0.9rem"
        }}>
          How to Register a MetaMask Wallet?{" "}
          <a
            href="https://support.metamask.io/start/getting-started-with-metamask/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              color: "#0374b1ff", 
              textDecoration: "underline",
              fontWeight: "500"
            }}
          >
            Read more.
          </a>
        </p>
        </div>
      </div>
    </div>
  );
}

// Logged In App - Full access (Verify + Register + Assign/Transfer Ownership)
function LoggedInApp({ account }) {
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
  const [assignSerial, setAssignSerial] = useState("");
  const [assignNewOwner, setAssignNewOwner] = useState("");
  const [transferSerial, setTransferSerial] = useState("");
  const [transferNewOwner, setTransferNewOwner] = useState("");
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [loadingTransfer, setLoadingTransfer] = useState(false);

  const companyRepAddress = "0x9Da7d2CA5C22E3134653920B98a7C9d272706329";
  const isCompanyRep = account.toLowerCase() === companyRepAddress.toLowerCase();

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

  async function verifyDevice(serialToVerify) {
    setInfo(null);
    if (!serialToVerify || serialToVerify.trim() === "") {
      setStatusMsg("❌ Please enter a serial number.");
      return;
    }

    try {
      setLoadingVerify(true);
      console.log("Calling fetchDevice for:", serialToVerify);
      const d = await fetchDevice(serialToVerify);
      console.log("fetchDevice result:", d);

      if (!d.existsInList) {
        setInfo({
          serial: serialToVerify,
          status: "invalid",
          message: "❌ Invalid Serial Number — not registered on-chain.",
        });
      } else if (d.valid === true || d.valid === "true" || d.valid == 1) {
        setInfo({
          serial: serialToVerify,
          status: "authentic",
          manufacturer: d.manufacturer || "—",
          date: d.productionDate || "—",
          location: d.productionLocation || "—",
          message: "✅ Authentic — device is valid and active.",
        });
      } else {
        setInfo({
          serial: serialToVerify,
          status: "revoked",
          manufacturer: d.manufacturer || "—",
          date: d.productionDate || "—",
          location: d.productionLocation || "—",
          message: "⚠️ Revoked — device was registered but has been invalidated.",
        });
      }
    } catch (err) {
      console.error("verifyDevice error (full):", err);
      setInfo(null);
    } finally {
      setLoadingVerify(false);
    }
  }

  async function assignOwnership() {
    setStatusMsg("");
    if (!assignSerial || !assignNewOwner) {
      setStatusMsg("❌ Please enter both serial number and new owner address.");
      return;
    }

    try {
      setLoadingAssign(true);
      setStatusMsg("⏳ Assigning ownership...");
      
      // Import and use assignOwnership function from contractConfig
      const { assignOwnership: assignOwnershipFunc } = await import("./contractConfig");
      await assignOwnershipFunc(assignSerial, assignNewOwner);
      
      setStatusMsg("✅ Ownership assigned successfully!");
      setAssignSerial("");
      setAssignNewOwner("");
    } catch (err) {
      console.error("assignOwnership error:", err);
      setStatusMsg("❌ Assignment failed: " + (err?.reason || err?.message || "Unknown"));
    } finally {
      setLoadingAssign(false);
    }
  }

  async function transferOwnership() {
    setStatusMsg("");
    if (!transferSerial || !transferNewOwner) {
      setStatusMsg("❌ Please enter both serial number and new owner address.");
      return;
    }

    try {
      setLoadingTransfer(true);
      setStatusMsg("⏳ Transferring ownership...");
      
      // Import and use transferOwnership function from contractConfig
      const { transferOwnership: transferOwnershipFunc } = await import("./contractConfig");
      await transferOwnershipFunc(transferSerial, transferNewOwner);
      
      setStatusMsg("✅ Ownership transferred successfully!");
      setTransferSerial("");
      setTransferNewOwner("");
    } catch (err) {
      console.error("transferOwnership error:", err);
      setStatusMsg("❌ Transfer failed: " + (err?.reason || err?.message || "Unknown"));
    } finally {
      setLoadingTransfer(false);
    }
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
      padding: 24, 
      fontFamily: "system-ui" 
    }}>

    {/* ADD BACK ARROW FOR LOGGED IN */}
    <button
      onClick={() => window.location.reload()}
      style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        background: "none",
        border: "none",
        fontSize: "24px",
        cursor: "pointer",
        color: "#0369a1",
        padding: "8px",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background-color 0.2s"
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(3, 105, 161, 0.1)"}
      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
    >
      ←
    </button>

      <div style={{ maxWidth: "1000px", margin: "0 auto", paddingTop: "60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h1 style={{ color: "#0369a1" }}>Dashboard - Internal Access</h1>
          <div style={{ color: "#0369a1", fontWeight: "bold" }}>
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </div>
        </div>

        {/* Status Message - MOVED TO TOP */}
        {statusMsg && (
          <div style={{ 
            marginBottom: "2rem",
            padding: "1rem", 
            borderRadius: "8px",
            background: statusMsg.includes("✅") ? "#dcfce7" : 
                       statusMsg.includes("❌") ? "#fee2e2" : "#fef3c7",
            color: statusMsg.includes("✅") ? "#059669" : 
                   statusMsg.includes("❌") ? "#dc2626" : "#d97706",
            textAlign: "center",
            fontWeight: "bold"
          }}>
            {statusMsg}
          </div>
        )}

        {/* Two-column layout for logged-in users */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          
          {/* Register Device Column */}
          <div style={{ 
            background: "white", 
            padding: "clamp(1rem, 4vw, 2rem)", 
            borderRadius: "16px", 
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            width: "90%",
            maxWidth: "400px",
            margin: "0 auto"
          }}>
            <h2 style={{ color: "#0369a1", marginBottom: "1rem" }}>Register New Device</h2>
            
            <input
              placeholder="Serial Number"
              value={newDevice.serialNumber}
              onChange={(e) => setNewDevice({ ...newDevice, serialNumber: e.target.value })}
              style={{ display: "block", width: "100%", marginBottom: "12px", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
            <input
              placeholder="Production Date"
              value={newDevice.productionDate}
              onChange={(e) => setNewDevice({ ...newDevice, productionDate: e.target.value })}
              style={{ display: "block", width: "100%", marginBottom: "12px", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
            <input
              placeholder="Production Location"
              value={newDevice.productionLocation}
              onChange={(e) => setNewDevice({ ...newDevice, productionLocation: e.target.value })}
              style={{ display: "block", width: "100%", marginBottom: "12px", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
            <input
              placeholder="Manufacturer"
              value={newDevice.manufacturer}
              onChange={(e) => setNewDevice({ ...newDevice, manufacturer: e.target.value })}
              style={{ display: "block", width: "100%", marginBottom: "12px", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />

            <button
              onClick={registerDevice}
              disabled={loadingRegister}
              style={{ 
                background: "#10b981", 
                color: "white", 
                padding: "12px 24px", 
                borderRadius: "8px", 
                border: "none",
                width: "100%",
                fontSize: "1rem",
                cursor: "pointer"
              }}
            >
              {loadingRegister ? "Registering..." : "Register Device"}
            </button>
          </div>

          {/* Verify Device Column */}
          <div style={{ 
            background: "white", 
            padding: "2rem", 
            borderRadius: "12px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
          }}>
            <h2 style={{ color: "#0369a1", marginBottom: "1rem" }}>Verify Device</h2>
            <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              Publicly accessible. For further information, visit{" "}
              <a
                href="https://sepolia.etherscan.io/address/0x93ED569271192b67F33e9D15f42b02Fe15c2F5f8#readContract"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#0369a1", textDecoration: "underline" }}
              >
                Etherscan
              </a>{" "}
              for behind-the-scenes authentication.
            </p>
            
            <input
              placeholder="Enter Serial Number"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              style={{ 
                width: "100%", 
                padding: "12px", 
                borderRadius: "8px", 
                border: "1px solid #cbd5e1", 
                marginBottom: "12px" 
              }}
            />
            <button
              onClick={() => verifyDevice(serial)}
              disabled={loadingVerify}
              style={{ 
                background: "#0369a1", 
                color: "white", 
                padding: "12px 24px", 
                borderRadius: "8px", 
                border: "none",
                width: "100%",
                fontSize: "1rem",
                cursor: "pointer"
              }}
            >
              {loadingVerify ? "Verifying..." : "Verify Device"}
            </button>

            {/* Verify Results Display */}
            {info && (
              <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#f8fafc", borderRadius: "8px" }}>
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
                  <p style={{ color: "red" }}><strong>Status:</strong> {info.message}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Assign and Transfer Ownership Section */}
        <div style={{ 
          background: "white", 
          padding: "2rem", 
          borderRadius: "12px", 
          marginTop: "2rem",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
        }}>
          <h2 style={{ color: "#0369a1", marginBottom: "1rem" }}>Assign and Transfer Ownership</h2>
          <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
            Access to this functionality is restricted to the address <strong>{companyRepAddress}</strong> (MediCodeUM). 
            <br />
            <br />This ensures that only the company representative may:
            <br />1. assign <strong>recently manufactured devices</strong> to the consumers
            <br />2. transfer ownership from one person to another 
            <br />**(in the case of the first owner selling their Glocoku to the second person.)
          </p>

          {!isCompanyRep && (
            <div style={{ 
              padding: "1rem", 
              background: "#fef3c7", 
              borderRadius: "8px",
              color: "#d97706",
              textAlign: "center",
              marginBottom: "1.5rem"
            }}>
              ⚠️ Access Denied: You are not the authorized company representative.
            </div>
          )}

          {isCompanyRep && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              
              {/* Assign Ownership Column */}
              <div>
                <h3 style={{ color: "#0369a1", marginBottom: "1rem" }}>Assign Ownership</h3>
                <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1rem" }}>
                  Assign initial ownership of a registered device to a new owner.
                </p>
                
                <input
                  placeholder="Device Serial Number"
                  value={assignSerial}
                  onChange={(e) => setAssignSerial(e.target.value)}
                  style={{ display: "block", width: "100%", marginBottom: "12px", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
                <input
                  placeholder="New Owner Address (0x...)"
                  value={assignNewOwner}
                  onChange={(e) => setAssignNewOwner(e.target.value)}
                  style={{ display: "block", width: "100%", marginBottom: "12px", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />

                <button
                  onClick={assignOwnership}
                  disabled={loadingAssign}
                  style={{ 
                    background: "#f59e0b", 
                    color: "white", 
                    padding: "12px 24px", 
                    borderRadius: "8px", 
                    border: "none",
                    width: "100%",
                    fontSize: "1rem",
                    cursor: "pointer"
                  }}
                >
                  {loadingAssign ? "Assigning..." : "Assign Ownership"}
                </button>
              </div>

              {/* Transfer Ownership Column */}
              <div>
                <h3 style={{ color: "#0369a1", marginBottom: "1rem" }}>Transfer Ownership</h3>
                <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1rem" }}>
                  Transfer ownership of a device from current owner to a new owner.
                </p>
                
                <input
                  placeholder="Device Serial Number"
                  value={transferSerial}
                  onChange={(e) => setTransferSerial(e.target.value)}
                  style={{ display: "block", width: "100%", marginBottom: "12px", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
                <input
                  placeholder="New Owner Address (0x...)"
                  value={transferNewOwner}
                  onChange={(e) => setTransferNewOwner(e.target.value)}
                  style={{ display: "block", width: "100%", marginBottom: "12px", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />

                <button
                  onClick={transferOwnership}
                  disabled={loadingTransfer}
                  style={{ 
                    background: "#8b5cf6", 
                    color: "white", 
                    padding: "12px 24px", 
                    borderRadius: "8px", 
                    border: "none",
                    width: "100%",
                    fontSize: "1rem",
                    cursor: "pointer"
                  }}
                >
                  {loadingTransfer ? "Transferring..." : "Transfer Ownership"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;