const REPOS_TREES = [
  { repo: "canaveensetia/Books", branch: "master", label: "Tech & Productivity" },
  { repo: "rishabhmodi03/BOOKS", branch: "master", label: "General Collection" },
  { repo: "Abdalrahman-Alhamod/Books", branch: "main", label: "Arabic & Engineering" },
  { repo: "EbookFoundation/free-programming-books", branch: "main", label: "Programming PDFs" },
];

console.log("Starting GitHub index scan...\n");

const promises = REPOS_TREES.map(async (target) => {
  try {
    const res = await fetch(`https://api.github.com/repos/${target.repo}/git/trees/${target.branch}?recursive=1`, {
      headers: { "User-Agent": "Grova-Library-Indexer" }
    });
    const data = await res.json();
    if (!data.tree) {
      console.log(`⚠️  ${target.repo}: No tree returned (Rate limited or empty)`);
      return { repo: target.repo, count: 0 };
    }
    const pdfs = data.tree.filter((f) => f.path.toLowerCase().endsWith(".pdf"));
    console.log(`✅ ${target.repo} (${target.label}): Found ${pdfs.length} PDFs`);
    return { repo: target.repo, count: pdfs.length };
  } catch (err) {
    console.error(`❌ ${target.repo}: Error:`, err.message);
    return { repo: target.repo, count: 0 };
  }
});

const results = await Promise.all(promises);
const total = results.reduce((acc, curr) => acc + curr.count, 0);
console.log(`\nTotal PDF books available in external GitHub repositories: ${total}`);
