import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "dotenv";
config();

async function test() {
  const region = process.env.AWS_REGION || "us-east-005";
  const endpoint = process.env.B2_ENDPOINT;
  const bucket = process.env.B2_BUCKET_NAME;
  const accessKeyId = process.env.B2_KEY_ID;
  const secretAccessKey = process.env.B2_APPLICATION_KEY;

  const s3 = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
  });

  const command = new GetObjectCommand({ Bucket: bucket, Key: "stories/test.jpg" });
  const url = await getSignedUrl(s3 as any, command as any, { expiresIn: 86400 });
  console.log("Signed URL:", url);
}

test().catch(console.error);
