import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envPath = path.join(root, ".env");
if (!fs.existsSync(envPath)) {
  console.error("Missing .env file");
  process.exit(1);
}

const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const dbUrl = env.DATABASE_URL;
const cUrl = env.CLOUDINARY_URL;

if (!cUrl) {
  console.error("CLOUDINARY_URL missing");
  process.exit(1);
}

// Parse Cloudinary credentials
const match = cUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
if (!match) {
  console.error("Invalid CLOUDINARY_URL format");
  process.exit(1);
}

const apiKey = match[1];
const apiSecret = match[2];
const cloudName = match[3];

const { v2: cloudinary } = await import("cloudinary");
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

// Create a dummy PDF buffer
const dummyPdfBuffer = Buffer.from("%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids []\n/Count 0\n>>\nendobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\ntrailer\n<<\n/Size 3\n/Root 1 0 R\n>>\nstartxref\n111\n%%EOF");

console.log("Testing direct upload of PDF to Cloudinary...");

async function testUpload(endpoint) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp }, apiSecret);

  const formData = new FormData();
  // Create a Blob from buffer to simulate browser file
  const fileBlob = new Blob([dummyPdfBuffer], { type: "application/pdf" });
  formData.append("file", fileBlob, "test.pdf");
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  if (endpoint === "raw") {
    formData.append("resource_type", "raw");
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${endpoint}/upload`;
  console.log(`\nUploading to ${url}...`);

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.error(`Upload to ${endpoint} failed:`, err);
  }
}

await testUpload("raw");
await testUpload("auto");
