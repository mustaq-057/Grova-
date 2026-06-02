/** Network status only — messages and media use Neon + Cloudinary/B2, not local queues. */

export const isOnline = () => navigator.onLine;
