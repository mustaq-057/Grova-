import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { bumpAvatarVersion } from "@/lib/avatar-display";
import { readFileAsDataUrl, uploadMedia } from "@/lib/media-upload";

const MAX_AVATAR_BYTES = 12 * 1024 * 1024;

export function useProfileAvatarCrop() {
  const { user, setUser } = useAuth();
  const [avatarToCrop, setAvatarToCrop] = useState<string | null>(null);
  const [pendingContentType, setPendingContentType] = useState("image/jpeg");
  const [uploading, setUploading] = useState(false);

  const handleAvatarFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !user) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please choose an image file");
        return;
      }
      if (file.size > MAX_AVATAR_BYTES) {
        toast.error("Image is too large (max 12MB)");
        return;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        setPendingContentType(file.type || "image/jpeg");
        setAvatarToCrop(dataUrl);
      } catch {
        toast.error("Could not read that image");
      }
    },
    [user],
  );

  const cancelCrop = useCallback(() => {
    setAvatarToCrop(null);
  }, []);

  const applyCrop = useCallback(
    async (croppedDataUrl: string) => {
      if (!user) return;
      setAvatarToCrop(null);
      setUploading(true);
      try {
        const cloudUrl = await uploadMedia(croppedDataUrl, pendingContentType);
        const updated = await api.updateProfile(user.id, { avatar: cloudUrl });
        bumpAvatarVersion(user.id);
        setUser({ ...user, avatar: updated.avatar });
        toast.success("Profile photo updated");
      } catch (err) {
        console.error("Failed to update avatar:", err);
        toast.error(err instanceof Error ? err.message : "Could not upload profile photo");
      } finally {
        setUploading(false);
      }
    },
    [user, pendingContentType, setUser],
  );

  return {
    handleAvatarFileChange,
    avatarToCrop,
    cancelCrop,
    applyCrop,
    uploading,
  };
}
