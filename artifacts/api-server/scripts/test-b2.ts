import { S3Client, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "dotenv";

config({ path: "../../.env" });

const s3 = new S3Client({ forcePathStyle: false,
  region: process.env.AWS_REGION || "us-east-005",
  endpoint: process.env.B2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
});

const bucketName = process.env.B2_BUCKET_NAME;

async function testConnection() {
  try {
    console.log("Testing connection to Backblaze B2...");
    console.log("Bucket:", bucketName);
    console.log("Endpoint:", process.env.B2_ENDPOINT);

    // Test List Objects
    console.log("\nTesting ListObjectsV2Command...");
    const listCmd = new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 5 });
    const listRes = await s3.send(listCmd);
    console.log("Successfully listed objects:", listRes.Contents ? listRes.Contents.length : 0, "found.");

    // Test generating a presigned PUT URL
    console.log("\nTesting Presigned PUT URL generation...");
    const putCmd = new PutObjectCommand({
      Bucket: bucketName,
      Key: "test-upload.pdf",
      ContentType: "application/pdf",
    });
    const url = await getSignedUrl(s3 as any, putCmd as any, { expiresIn: 3600 });
    console.log("Presigned URL:", url.substring(0, 100) + "...");
    
    console.log("\nAll tests passed successfully!");
  } catch (error) {
    console.error("\nError testing connection:");
    console.error(error);
  }
}

testConnection();
