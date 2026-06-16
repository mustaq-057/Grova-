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
if img is None:
    print(f"Error: Could not read image {image_path}")
    exit(1)

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# The background is likely white/cream. The stickers have rounded borders or distinct colors.
# Let's apply a threshold.
_, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)

# Find contours
contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

boxes = []
for c in contours:
    x, y, w, h = cv2.boundingRect(c)
    area = w * h
    aspect_ratio = w / float(h)
    
    # The whole image is likely large (e.g., 1000x1000 or more). 
    # Let's assume stickers are at least 50x50.
    if w > 50 and h > 50 and 0.7 < aspect_ratio < 1.3:
        boxes.append((x, y, w, h))

print(f"Found {len(boxes)} boxes via threshold.")

# Sort boxes top-to-bottom, left-to-right
# To do this robustly:
# Group by rows based on Y coordinate. If Y difference is small, they are in the same row.
boxes = sorted(boxes, key=lambda b: b[1])

rows = []
current_row = []
last_y = -1

for box in boxes:
    x, y, w, h = box
    if last_y == -1 or abs(y - last_y) < 50:
        current_row.append(box)
    else:
        current_row = sorted(current_row, key=lambda b: b[0])
        rows.append(current_row)
        current_row = [box]
    last_y = y

if current_row:
    current_row = sorted(current_row, key=lambda b: b[0])
    rows.append(current_row)

sticker_count = 1
for row_idx, row in enumerate(rows):
    print(f"Row {row_idx + 1}: {len(row)} stickers")
    for col_idx, box in enumerate(row):
        x, y, w, h = box
        # Save the crop
        crop = img[y:y+h, x:x+w]
        cv2.imwrite(os.path.join(output_dir, f"{sticker_count}.png"), crop)
        sticker_count += 1
