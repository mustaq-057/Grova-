import { BOOK_CATALOG } from "../artifacts/api-server/src/lib/book-catalog.ts";

console.log("CATALOG_BOOKS:", BOOK_CATALOG.length);

const categories: Record<string, number> = {};
for (const entry of BOOK_CATALOG) {
  categories[entry.category] = (categories[entry.category] || 0) + 1;
}

console.log("\nBooks by category:");
for (const [cat, count] of Object.entries(categories)) {
  console.log(`- ${cat}: ${count}`);
}
