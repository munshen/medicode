import { useState } from "react";
import { assignOwnership, transferOwnership } from "../contractConfig";

export default function Ownership() {
  const [serial, setSerial] = useState("");
  const [newOwner, setNewOwner] = useState("");

  const handleAssign = async () => {
    try {
      await assignOwnership(serial, newOwner);
      alert("Ownership assigned successfully!");
    } catch (err) {
      alert("Failed to assign ownership. Check console.");
    }
  };

  const handleTransfer = async () => {
    try {
      await transferOwnership(serial, newOwner);
      alert("Ownership transferred successfully!");
    } catch (err) {
      alert("Failed to transfer ownership. Check console.");
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Serial Number"
        value={serial}
        onChange={(e) => setSerial(e.target.value)}
      />
      <input
        type="text"
        placeholder="New Owner Address"
        value={newOwner}
        onChange={(e) => setNewOwner(e.target.value)}
      />
      <button onClick={handleAssign}>Assign Ownership (Authority Only)</button>
      <button onClick={handleTransfer}>Transfer Ownership (Owner Only)</button>
    </div>
  );
}
