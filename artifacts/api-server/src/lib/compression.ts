import compression from "compression";

export function setupCompression(app: any): void {
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024, // Only compress responses larger than 1KB
    level: 6, // Compression level (1-9)
  }));
}
