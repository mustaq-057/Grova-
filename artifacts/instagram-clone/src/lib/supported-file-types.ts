/**
 * Comprehensive list of supported file types for file sharing
 */

export const SUPPORTED_FILE_TYPES = {
  // Documents
  documents: {
    "text/plain": ".txt",
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "text/rtf": ".rtf",
    "application/vnd.oasis.opendocument.text": ".odt",
    "text/markdown": ".md",
    "application/x-latex": ".tex",
  },

  // Spreadsheets
  spreadsheets: {
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "text/csv": ".csv",
    "application/vnd.oasis.opendocument.spreadsheet": ".ods",
  },

  // Presentations
  presentations: {
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
    "application/vnd.oasis.opendocument.presentation": ".odp",
  },

  // Images
  images: {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/bmp": ".bmp",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/tiff": ".tiff",
    "image/x-icon": ".ico",
    "image/heic": ".heic",
    "image/heif": ".heif",
  },

  // Videos
  videos: {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "video/x-m4v": ".m4v",
    "video/x-matroska": ".mkv",
    "video/3gpp": ".3gp",
    "video/x-msvideo": ".avi",
  },

  // Audio
  audio: {
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/aac": ".aac",
    "audio/mp4": ".m4a",
    "audio/ogg": ".ogg",
    "audio/flac": ".flac",
    "audio/x-ms-wma": ".wma",
    "audio/midi": ".mid",
  },


  // Archives
  archives: {
    "application/zip": ".zip",
    "application/x-rar-compressed": ".rar",
    "application/x-7z-compressed": ".7z",
    "application/x-tar": ".tar",
    "application/gzip": ".gz",
    "application/x-bzip2": ".bz2",
    "application/x-xz": ".xz",
  },

  // Programming
  programming: {
    "text/x-python": ".py",
    "text/x-java-source": ".java",
    "text/x-csrc": ".c",
    "text/x-c++src": ".cpp",
    "text/x-csharp": ".cs",
    "application/javascript": ".js",
    "application/typescript": ".ts",
    "application/x-php": ".php",
    "text/x-ruby": ".rb",
    "text/x-go": ".go",
    "text/x-rustsrc": ".rs",
    "text/x-swift": ".swift",
    "text/x-kotlin": ".kt",
    "application/dart": ".dart",
  },

  // Web Development
  web: {
    "text/html": ".html",
    "text/css": ".css",
    "application/xml": ".xml",
    "application/json": ".json",
    "application/x-yaml": ".yaml",
  },

  // Databases
  databases: {
    "application/x-sqlite3": ".db",
    "application/x-sqlite": ".sqlite",
    "application/sql": ".sql",
    "application/x-msaccess": ".mdb",
  },

  // Mobile
  mobile: {
    "application/vnd.android.package-archive": ".apk",
    "application/vnd.android.app-package-archive": ".aab",
    "application/x-ipa": ".ipa",
  },

  // Executables
  executables: {
    "application/x-msdownload": ".exe",
    "application/x-msi": ".msi",
    "application/x-bat": ".bat",
    "application/x-cmd": ".cmd",
    "application/x-shellscript": ".sh",
  },

  // Design & 3D
  design: {
    "image/vnd.adobe.photoshop": ".psd",
    "application/illustrator": ".ai",
    "application/x-xd": ".xd",
    "application/x-figma": ".fig",
    "application/x-blend": ".blend",
    "model/obj": ".obj",
    "model/x-gltf-binary": ".fbx",
    "model/stl": ".stl",
  },

  // Fonts
  fonts: {
    "font/ttf": ".ttf",
    "font/otf": ".otf",
    "font/woff": ".woff",
    "font/woff2": ".woff2",
  },
};

// Flatten to create a list of all supported mime types
export const SUPPORTED_MIME_TYPES = Object.values(SUPPORTED_FILE_TYPES)
  .reduce((acc, category) => [...acc, ...Object.keys(category)], [] as string[])
  .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

// Create accept string for file input
export const FILE_INPUT_ACCEPT = SUPPORTED_MIME_TYPES.join(",");

/** Documents-only accept — excludes images, video, and audio so mobile won't offer camera or screen recorder. */
export const DOCUMENTS_ONLY_ACCEPT = SUPPORTED_MIME_TYPES.filter(
  (mime) =>
    !mime.startsWith("image/") &&
    !mime.startsWith("video/"),
).join(",");

const CAMERA_PHOTO_NAME =
  /^(IMG_|DSC_|PXL_|MVIMG_|photo_|image_|Screenshot|\d{8}_\d{6})/i;

// Helper function to check if a file is supported
export function isSupportedFileType(mimeType?: string, filename?: string): boolean {
  if (!mimeType && !filename) return false;

  const mime = mimeType?.split(";")[0]?.trim().toLowerCase() || "";

  // Check by MIME type first
  if (mime && mime !== "application/octet-stream" && SUPPORTED_MIME_TYPES.includes(mime)) {
    return true;
  }

  // Check by extension
  if (filename) {
    if (CAMERA_PHOTO_NAME.test(filename)) return true;

    const dot = filename.lastIndexOf(".");
    if (dot >= 0) {
      const ext = filename.substring(dot).toLowerCase();
      const supportedExts = Object.values(SUPPORTED_FILE_TYPES)
        .flatMap((category) => Object.values(category))
        .map((e) => e.toLowerCase());

      if (supportedExts.includes(ext)) {
        return true;
      }
    }
  }

  return false;
}

// Max file size (in MB)
export const MAX_FILE_SIZE_MB = 500; // 500MB for files

// Get file category emoji/icon
export function getFileTypeCategory(mimeType?: string, filename?: string): string {
  const m = mimeType ?? "";
  const n = (filename ?? "").toLowerCase();

  if (m.includes("pdf") || n.endsWith(".pdf")) return "📄";
  if (m.startsWith("video/") || /\.(mp4|mov|webm|mkv|avi)$/i.test(n)) return "🎬";
  if (m.startsWith("audio/") || /\.(mp3|wav|m4a|ogg|flac)$/i.test(n)) return "🎵";
  if (m.includes("zip") || m.includes("rar") || m.includes("7z") || /\.(zip|rar|7z)$/i.test(n)) return "🗜️";
  if (m.includes("word") || /\.(doc|docx)$/i.test(n)) return "📝";
  if (m.includes("sheet") || /\.(xls|xlsx|csv)$/i.test(n)) return "📊";
  if (m.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(n)) return "🖼️";
  if (m.includes("presentation") || /\.(ppt|pptx|odp)$/i.test(n)) return "📺";
  if (m.startsWith("text/") || /\.(txt|md|rtf)$/i.test(n)) return "📃";
  if (m.includes("java") || m.includes("script") || /\.(py|js|ts|java|cpp|rs)$/i.test(n)) return "💻";

  return "📎"; // Default file icon
}
