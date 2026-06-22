import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

async function setCors() {
  const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-005",
    endpoint: process.env.B2_ENDPOINT,
    credentials: { 
      accessKeyId: process.env.B2_KEY_ID!, 
      secretAccessKey: process.env.B2_APPLICATION_KEY! 
    },
  });

  const command = new PutBucketCorsCommand({
    Bucket: process.env.B2_BUCKET_NAME!,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "PUT", "POST", "HEAD"],
          AllowedOrigins: ["*"], // Same as "Share everything in this bucket with all HTTPS origins" but explicitly allows PUT
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  });

  try {
    await s3.send(command);
    console.log("✅ Successfully updated CORS for B2 bucket!");
  } catch (err) {
    console.error("❌ Failed to set CORS:", err);
  }
}

setCors();
