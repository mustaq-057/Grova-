import cv2
import numpy as np

img = cv2.imread('themes/stickerz.png', cv2.IMREAD_GRAYSCALE)
# Invert so background (white) is 0 and content is > 0
_, inv = cv2.threshold(img, 240, 255, cv2.THRESH_BINARY_INV)

# Project horizontally (sum across columns) to find row gaps
horizontal_sum = np.sum(inv, axis=1)

# Find where sum is zero or very low (gaps)
gaps = horizontal_sum < (np.max(horizontal_sum) * 0.05)

# Find contiguous regions of content (rows)
rows = []
in_row = False
start_y = 0

for y, is_gap in enumerate(gaps):
    if not is_gap and not in_row:
        in_row = True
        start_y = y
    elif is_gap and in_row:
        in_row = False
        if y - start_y > 50:  # Minimum height for a row
            rows.append((start_y, y))

if in_row and len(gaps) - start_y > 50:
    rows.append((start_y, len(gaps)))

print("Detected rows (y_start, y_end):")
for r in rows:
    print(r)

# Same for columns
vertical_sum = np.sum(inv, axis=0)
col_gaps = vertical_sum < (np.max(vertical_sum) * 0.05)

cols = []
in_col = False
start_x = 0
for x, is_gap in enumerate(col_gaps):
    if not is_gap and not in_col:
        in_col = True
        start_x = x
    elif is_gap and in_col:
        in_col = False
        if x - start_x > 50:
            cols.append((start_x, x))

if in_col and len(col_gaps) - start_x > 50:
    cols.append((start_x, len(col_gaps)))

print("Detected cols (x_start, x_end):")
for c in cols:
    print(c)
