import os
import shutil

output_dir = "artifacts/instagram-clone/public/stickerz"

# Rename 1.png to imagecopy1.png, etc.
for i in range(1, 33):
    old_path = os.path.join(output_dir, f"{i}.png")
    new_path = os.path.join(output_dir, f"imagecopy{i}.png")
    if os.path.exists(old_path):
        os.rename(old_path, new_path)
    else:
        # maybe already renamed or missing? Let's check themes just in case
        pass
