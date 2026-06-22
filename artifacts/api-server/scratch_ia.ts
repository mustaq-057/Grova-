import { searchInternetArchive } from "./src/lib/library-sources.js";

async function test() {
  const q = `mediatype:texts AND format:PDF AND -access-restricted-item:true AND (title:(white nights) OR creator:(white nights) OR white nights)`;
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier,title,creator,description,format&rows=5&output=json`;
  
  const res = await fetch(url);
  const json = await res.json();
  console.log("Docs found:", json.response.numFound);
  console.log(JSON.stringify(json.response.docs, null, 2));
}
test();
