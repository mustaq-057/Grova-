import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "dotenv";
config({ path: "../../.env" });

async function test() {
  const region = process.env.AWS_REGION || "us-east-005";
  const endpoint = process.env.B2_ENDPOINT;
  const bucket = process.env.B2_BUCKET_NAME;
  const accessKeyId = process.env.B2_KEY_ID;
  const secretAccessKey = process.env.B2_APPLICATION_KEY;

  const s3 = new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
  });

  // Try to generate a signed URL for a story key we know might exist or just a test key
  const command = new GetObjectCommand({ Bucket: bucket, Key: "stories/test.mp4" });
  const url = await getSignedUrl(s3 as any, command as any, { expiresIn: 86400 });
  console.log("Generated Signed URL:", url);

  try {
    const res = await fetch(url);
    console.log("Fetch Status:", res.status);
    const text = await res.text();
    console.log("Fetch Response (first 200 chars):", text.slice(0, 200));
  } catch (err: any) {
    console.error("Fetch failed:", err.message);
  }
}

test().catch(console.error);
