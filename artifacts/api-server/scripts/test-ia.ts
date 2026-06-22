import { searchInternetArchive } from "../src/lib/library-sources";

async function testIA() {
  const books = [
    "فاتتني صلاة",
    "Can't Hurt Me",
    "Atomic Habits",
    "Rich Dad Poor Dad",
    "White Nights Dostoevsky"
  ];
  for (const b of books) {
    try {
      const res = await searchInternetArchive(b, { limit: 10 });
      const firstPdf = res.find(r => r.epubUrl);
      console.log(`[${b}]: ${firstPdf ? firstPdf.epubUrl : 'NOT FOUND'}`);
    } catch (e) {
      console.log(`[${b}]: ERROR`);
    }
  }
}
testIA();
