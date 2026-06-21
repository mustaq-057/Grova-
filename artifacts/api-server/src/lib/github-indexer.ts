import { randomUUID } from "crypto";

export interface GithubBook {
  id: string;
  title: string;
  author: string;
  epubUrl: string;
  coverUrl: string | null;
  description: string;
  source: string;
  totalPages: number;
}

let githubCache: GithubBook[] = [];
let isInitialized = false;

const REPOS_TREES = [
  { repo: "canaveensetia/Books", branch: "master", label: "Tech & Productivity" },
  { repo: "rishabhmodi03/BOOKS", branch: "master", label: "General Collection" },
  { repo: "Abdalrahman-Alhamod/Books", branch: "main", label: "Arabic & Engineering" },
  { repo: "EbookFoundation/free-programming-books", branch: "main", label: "Programming PDFs" },
];

const REPOS_RELEASES: { repo: string; label: string }[] = [];

export async function initGithubIndexer() {
  if (isInitialized) return;
  
  try {
    const promises = [];
    
    // Fetch Trees
    for (const target of REPOS_TREES) {
      promises.push(
        fetch(`https://api.github.com/repos/${target.repo}/git/trees/${target.branch}?recursive=1`, {
          headers: { "User-Agent": "Grova-Library-Indexer" }
        })
        .then(r => r.json())
        .then((data: any) => {
          if (!data.tree) return;
          const files = data.tree.filter((f: any) => f.path.toLowerCase().endsWith(".pdf"));
          
          files.forEach((f: any) => {
            // Extract filename without extension for title
            const filename = f.path.split("/").pop();
            if (!filename) return;
            const title = filename.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
            
            githubCache.push({
              id: `gh_${randomUUID().substring(0,8)}`,
              title: title.trim(),
              author: "GitHub Open Source",
              epubUrl: `https://cdn.jsdelivr.net/gh/${target.repo}@${target.branch}/${f.path.split("/").map(encodeURIComponent).join("/")}`,
              coverUrl: null,
              description: `A file from the ${target.label} GitHub repository (${target.repo}).`,
              source: `GitHub (${target.repo.split("/")[0]})`,
              totalPages: 250,
            });
          });
        })
        .catch(err => console.error(`Failed to index ${target.repo}:`, err.message))
      );
    }
    
    // Fetch Releases
    for (const target of REPOS_RELEASES) {
      promises.push(
        fetch(`https://api.github.com/repos/${target.repo}/releases`, {
          headers: { "User-Agent": "Grova-Library-Indexer" }
        })
        .then(r => r.json())
        .then((releases: any) => {
          if (!Array.isArray(releases)) return;
          releases.forEach((release: any) => {
            (release.assets || []).forEach((asset: any) => {
              if (asset.name.toLowerCase().endsWith(".pdf")) {
                githubCache.push({
                  id: `gh_rel_${randomUUID().substring(0,8)}`,
                  title: asset.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "),
                  author: "Open Source Contributor",
                  epubUrl: asset.browser_download_url,
                  coverUrl: null,
                  description: `High-quality Arabic release from ${target.label} (${target.repo}).`,
                  source: `GitHub (${target.repo.split("/")[0]})`,
                  totalPages: 300,
                });
              }
            });
          });
        })
        .catch(err => console.error(`Failed to index release ${target.repo}:`, err.message))
      );
    }

    await Promise.allSettled(promises);
    isInitialized = true;
    console.log(`[GitHub Indexer] Successfully indexed ${githubCache.length} direct PDF files into memory.`);
  } catch (error) {
    console.error("[GitHub Indexer] Initialization failed:", error);
  }
}

export async function searchGithubIndex(query: string, limit = 6): Promise<GithubBook[]> {
  if (!isInitialized) {
    await initGithubIndexer();
  }
  
  if (!query) return [];
  const lowerQuery = query.toLowerCase();
  
  const matches = githubCache.filter(book => 
    book.epubUrl.toLowerCase().includes(".pdf") &&
    (book.title.toLowerCase().includes(lowerQuery) || 
    book.author.toLowerCase().includes(lowerQuery))
  );
  
  return matches.slice(0, limit);
}
