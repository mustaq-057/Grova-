import cv2
import numpy as np
import os
import shutil

image_path = "themes/stickerz.png"
output_dir = "artifacts/instagram-clone/public/stickerz"

if os.path.exists(output_dir):
    shutil.rmtree(output_dir)
os.makedirs(output_dir)

img = cv2.imread(image_path)
bg_color = np.array([240, 249, 251], dtype=np.int16)

# Calculate difference from background
diff = np.abs(img.astype(np.int16) - bg_color)
sum_diff = np.sum(diff, axis=2)

# Create a binary mask where difference > 20
mask = np.uint8(sum_diff > 30) * 255

# Morphological operations to clean up
kernel = np.ones((5,5), np.uint8)
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

# Find contours
contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

boxes = []
for c in contours:
    x, y, w, h = cv2.boundingRect(c)
    # Filter by size: stickers should be somewhat large
    if w > 80 and h > 80 and w < 400 and h < 400:
        boxes.append((x, y, w, h))

print(f"Found {len(boxes)} stickers.")

# We want exactly 40. Let's see what we get.
# Sort into rows and columns
boxes.sort(key=lambda b: b[1]) # Sort by Y

rows = []
curr_row = []
last_y = -1

for b in boxes:
    if last_y == -1 or abs(b[1] - last_y) < 50:
        curr_row.append(b)
    else:
        curr_row.sort(key=lambda bx: bx[0])
        rows.append(curr_row)
        curr_row = [b]
    last_y = b[1]

if curr_row:
    curr_row.sort(key=lambda bx: bx[0])
    rows.append(curr_row)

count = 1
for r in rows:
    for b in r:
        x, y, w, h = b
        # Expand box slightly to ensure we capture the whole sticker
        # pad = 5
        # x1 = max(0, x - pad)
        # y1 = max(0, y - pad)
        # x2 = min(img.shape[1], x + w + pad)
        # y2 = min(img.shape[0], y + h + pad)
        
        crop = img[y:y+h, x:x+w]
        cv2.imwrite(os.path.join(output_dir, f"{count}.png"), crop)
        count += 1

print(f"Saved {count-1} stickers.")
