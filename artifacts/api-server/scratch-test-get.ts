import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "dotenv";
config({ path: "../../.env" });

async function testGet() {
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

  const command = new GetObjectCommand({ Bucket: bucket, Key: "stories/test-upload.jpg" });
  const url = await getSignedUrl(s3 as any, command as any, { expiresIn: 86400 });
  console.log("GET URL:", url);

  try {
    const res = await fetch(url);
    console.log("GET Status:", res.status);
    console.log("GET Content-Type:", res.headers.get("Content-Type"));
    const buffer = await res.arrayBuffer();
    console.log("GET Bytes read:", buffer.byteLength);
  } catch (err: any) {
    console.error("GET Failed:", err.message);
  }
}

testGet().catch(console.error);
