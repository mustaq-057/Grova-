import cv2
import os
import shutil

image_path = "themes/stickerz.png"
output_dir = "artifacts/instagram-clone/public/stickerz"

if os.path.exists(output_dir):
    shutil.rmtree(output_dir)
os.makedirs(output_dir)

img = cv2.imread(image_path)

col_w = 1536 // 8  # 192
row_h = 180

# Y coordinates for the 5 rows
row_ys = [
    40,        # Row 1
    220,       # Row 2
    440,       # Row 3
    620,       # Row 4
    840        # Row 5
]

count = 1
for row_idx, y in enumerate(row_ys):
    for col in range(8):
        x = col * col_w
        crop = img[y:y+row_h, x:x+col_w]
        cv2.imwrite(os.path.join(output_dir, f"{count}.png"), crop)
        count += 1

print("Successfully cropped 40 stickers!")
