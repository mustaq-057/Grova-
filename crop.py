from PIL import Image
import os

img_path = 'artifacts/instagram-clone/public/themes/camelon.png'
out_path = 'artifacts/instagram-clone/public/themes/camelon_cropped.png'

if os.path.exists(img_path):
    img = Image.open(img_path)
    bbox = img.getbbox()
    print('Original size:', img.size)
    print('BBox:', bbox)
    if bbox:
        img = img.crop(bbox)
    img.save(out_path)
    print('Cropped and saved to camelon_cropped.png')
else:
    print('Image not found:', img_path)
