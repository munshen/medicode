// src/utils/pinataUpload.js
import axios from "axios";

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY;

export async function uploadDeviceDataToIPFS(deviceData) {
  try {
    const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

    const response = await axios.post(url, deviceData, {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
    });

    console.log("✅ Uploaded to IPFS:", response.data);
    return response.data.IpfsHash;
  } catch (error) {
    console.error("❌ IPFS upload failed:", error);
    throw new Error("Failed to upload to IPFS");
  }
}
