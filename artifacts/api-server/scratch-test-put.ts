import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "dotenv";
config({ path: "../../.env" });

async function testPut() {
  const region = process.env.AWS_REGION || "us-east-005";
  const endpoint = process.env.B2_ENDPOINT;
  const bucket = process.env.B2_BUCKET_NAME;
  const accessKeyId = process.env.B2_KEY_ID;
  const secretAccessKey = process.env.B2_APPLICATION_KEY;

  const s3 = new S3Client({
    region,
    endpoint,
    // Note: I am NOT using forcePathStyle: true here, exactly like images.ts
    credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
  });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: "stories/test-upload.jpg",
    ContentType: "image/jpeg",
  });

  const url = await getSignedUrl(s3 as any, command as any, { expiresIn: 3600 });
  console.log("PUT URL:", url);

  const emptyImage = Buffer.from("R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=", "base64");

  try {
    const res = await fetch(url, {
      method: "PUT",
      body: emptyImage,
      headers: { "Content-Type": "image/jpeg" },
    });
    console.log("PUT Status:", res.status);
    const text = await res.text();
    console.log("PUT Response:", text);
  } catch (err: any) {
    console.error("PUT Failed:", err.message);
  }
}

testPut().catch(console.error);
