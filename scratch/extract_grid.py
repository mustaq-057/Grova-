import cv2
import os
import shutil

image_path = "themes/stickerz.png"
output_dir = "artifacts/instagram-clone/public/stickerz"

shutil.rmtree(output_dir, ignore_errors=True)
os.makedirs(output_dir, exist_ok=True)

img = cv2.imread(image_path)
h, w = img.shape[:2]

row_h = h // 5
col_w = w // 8

count = 1
for i in range(5):
    for j in range(8):
        crop = img[i*row_h:(i+1)*row_h, j*col_w:(j+1)*col_w]
        cv2.imwrite(f"{output_dir}/{count}.png", crop)
        count += 1

print("Perfect grid crop completed.")
