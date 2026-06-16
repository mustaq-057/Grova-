import os
import shutil

input_dir = "themes"
output_dir = "artifacts/instagram-clone/public/stickerz"

# Clear output dir
if os.path.exists(output_dir):
    shutil.rmtree(output_dir)
os.makedirs(output_dir)

# Map names to 1.png, 2.png, ..., 32.png
for i in range(1, 33):
    if i == 1:
        filename = "image copy.png"
    else:
        filename = f"image copy {i}.png"
        
    src = os.path.join(input_dir, filename)
    dst = os.path.join(output_dir, f"{i}.png")
    
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f"Copied {filename} -> {i}.png")
    else:
        print(f"Warning: {filename} not found!")
