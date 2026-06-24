import { config } from "dotenv";
config();

const endpoint = process.env.B2_ENDPOINT;
const bucket = process.env.B2_BUCKET_NAME;

// Test urls
const urls = [
  `https://f005.backblazeb2.com/file/${bucket}/stories/123.mp4`,
  `${process.env.B2_PUBLIC_URL}/stories/123.mp4`,
  `https://s3.us-east-005.backblazeb2.com/${bucket}/stories/123.mp4`
];

for (const url of urls) {
    let key = "";
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.pathname.includes(`/file/${bucket}/`)) {
        key = parsedUrl.pathname.split(`/file/${bucket}/`)[1];
      } else if (parsedUrl.hostname === new URL(endpoint!).hostname) {
         key = parsedUrl.pathname.split(`/${bucket}/`)[1];
      } else if (process.env.B2_PUBLIC_URL && url.startsWith(process.env.B2_PUBLIC_URL)) {
         key = url.slice(process.env.B2_PUBLIC_URL.length).replace(/^\//, "");
      }
    } catch (err: any) { 
        console.error(err.message);
    }
    console.log({ url, key });
}
