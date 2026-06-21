/** Parse Cloudinary credentials from CLOUDINARY_URL or discrete env vars. */

export type CloudinaryCredentials = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

export function parseCloudinaryCredentials(): CloudinaryCredentials | null {
  const url = (process.env.CLOUDINARY_URL || "").trim();
  if (url.startsWith("cloudinary://")) {
    const match = url.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    if (match) {
      return {
        apiKey: match[1]!.trim(),
        apiSecret: match[2]!.trim(),
        cloudName: match[3]!.trim(),
      };
    }
    return null;
  }

  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();
  if (cloudName && apiKey && apiSecret) {
    return { cloudName, apiKey, apiSecret };
  }
  return null;
}

export function requireCloudinaryCredentials(): CloudinaryCredentials {
  const creds = parseCloudinaryCredentials();
  if (!creds) {
    throw new Error(
      "Cloudinary not configured. Set CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME in Vercel.",
    );
  }
  return creds;
}

/** Previous Grova Cloudinary cloud names — URLs still in DB until migrated. */
export const LEGACY_CLOUDINARY_CLOUDS = ["dd3b7rncf", "djlbatypz"] as const;

export function isLegacyCloudinaryUrl(url: string): boolean {
  if (!url) return false;
  return LEGACY_CLOUDINARY_CLOUDS.some((cloud) => url.includes(`res.cloudinary.com/${cloud}/`));
}
