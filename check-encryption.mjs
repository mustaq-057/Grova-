import { createClient } from "@libsql/client";

const db = createClient({
  url: "libsql://mustaq-mustaq-057.aws-ap-south-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAwMjE1OTgsImlkIjoiMDE5ZTcxOGQtNGUwMS03ZGY3LWE4ZWMtYjU5NTcyNDQ3OTE2IiwicmlkIjoiZThiNjY5NGMtZjE5NS00NDM3LWI4MmItZjc0Y2MwMDE4YzQ0In0.zuOa6DqHBPr-9VBuHdGscM9Po4YErwOthZbEppqDLplXb9AkP0tEA60t4QY30Lrd2-8OmNxV7PSdrev42Bc5Bw"
});

const result = await db.execute("SELECT id, sender_id, text FROM messages ORDER BY timestamp DESC LIMIT 1");
const row = result.rows[0];

console.log("Raw database data:");
console.log("ID:", row.id);
console.log("Sender ID:", row.sender_id);
console.log("Text (raw from DB):", row.text);
console.log("Text type:", typeof row.text);
console.log("Text length:", row.text?.length);

if (row.text) {
  console.log("\nText looks encrypted:", row.text.includes(":"));
  console.log("Text contains special characters:", /[^\w\s]/.test(row.text));
}
