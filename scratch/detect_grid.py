import cv2
import numpy as np

img = cv2.imread('themes/image.png', cv2.IMREAD_GRAYSCALE)
# Invert so background is 0 and content is > 0
# Let's find background color from edges
bg_color = np.median(img[:10, :10])
_, inv = cv2.threshold(img, int(bg_color) - 10, 255, cv2.THRESH_BINARY_INV)

# Project horizontally (sum across columns) to find row gaps
horizontal_sum = np.sum(inv, axis=1)
# Find gaps
gaps_h = horizontal_sum < (np.max(horizontal_sum) * 0.05)

rows = 0
in_row = False
for is_gap in gaps_h:
    if not is_gap and not in_row:
        in_row = True
        rows += 1
    elif is_gap and in_row:
        in_row = False

# Same for columns
vertical_sum = np.sum(inv, axis=0)
gaps_v = vertical_sum < (np.max(vertical_sum) * 0.05)

cols = 0
in_col = False
for is_gap in gaps_v:
    if not is_gap and not in_col:
        in_col = True
        cols += 1
    elif is_gap and in_col:
        in_col = False

print(f"Detected {rows} rows and {cols} columns.")
