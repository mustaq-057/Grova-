import { config } from "dotenv";
config({ path: "../../.env" });
import db from "./src/lib/db";

async function signB2GetUrl(url: string): Promise<string> {
  try {
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const region = process.env.AWS_REGION || "us-east-005";
    const endpoint = process.env.B2_ENDPOINT;
    const bucket = process.env.B2_BUCKET_NAME;
    const accessKeyId = process.env.B2_KEY_ID;
    const secretAccessKey = process.env.B2_APPLICATION_KEY;

    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return url;

    // extract key from url
    let key = "";
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.pathname.includes(`/file/${bucket}/`)) {
        key = parsedUrl.pathname.split(`/file/${bucket}/`)[1];
      } else if (parsedUrl.hostname === new URL(endpoint).hostname) {
         key = parsedUrl.pathname.split(`/${bucket}/`)[1];
      } else if (process.env.B2_PUBLIC_URL && url.startsWith(process.env.B2_PUBLIC_URL)) {
         key = url.slice(process.env.B2_PUBLIC_URL.length).replace(/^\//, "");
      }
    } catch { }

    if (!key) return url;

    const s3 = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    // 24 hours expiry
    return await getSignedUrl(s3 as any, command as any, { expiresIn: 86400 });
  } catch (err) {
    console.error("signB2GetUrl error:", err);
    return url;
  }
}

async function check() {
  const result = await db.query("SELECT * FROM stories ORDER BY created_at DESC LIMIT 5");
  const story = result.rows[0];
  console.log("Original Media URL:", story.media_url);
  const signed = await signB2GetUrl(story.media_url);
  console.log("Signed Media URL:", signed);

  try {
    const res = await fetch(signed);
    console.log("Fetch Signed URL Status:", res.status);
    console.log("Fetch Signed URL Content-Type:", res.headers.get("content-type"));
  } catch (e: any) {
    console.error("Fetch Signed URL Failed:", e.message);
  }
}

check().catch(console.error).finally(() => process.exit(0));
