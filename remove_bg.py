from PIL import Image

def remove_black_background(img_path, out_path):
    try:
        img = Image.open(img_path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for item in datas:
            # Check if pixel is black or very dark (tolerance)
            if item[0] < 30 and item[1] < 30 and item[2] < 30:
                newData.append((255, 255, 255, 0)) # Transparent
            else:
                newData.append(item)
                
        img.putdata(newData)
        
        # Crop to the new bounding box (ignoring the transparent pixels)
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
            
        img.save(out_path, "PNG")
        print("Successfully removed black background and cropped!")
    except Exception as e:
        print("Error:", e)

remove_black_background(
    'artifacts/instagram-clone/public/themes/camelon.png',
    'artifacts/instagram-clone/public/themes/camelon_cropped.png'
)
