from PIL import Image, ImageDraw

def remove_bg(img_path, out_path):
    # Open image and convert to RGBA
    img = Image.open(img_path).convert("RGBA")
    
    # Create a new image for processing with a 1px border so floodfill can reach all edges
    w, h = img.size
    padded = Image.new("RGBA", (w+2, h+2), (0,0,0,0))
    padded.paste(img, (1, 1))
    
    # We assume the top-left pixel of the original image is the background color
    bg_color = padded.getpixel((1, 1))
    print("Detected bg color:", bg_color)
    
    # Use floodfill to change the background to magenta (a magic color we won't use)
    magic_color = (255, 0, 255, 255)
    ImageDraw.floodfill(padded, (0, 0), magic_color, thresh=40)
    
    # Now replace magic color with transparent
    data = padded.getdata()
    new_data = []
    for p in data:
        if p == magic_color:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(p)
            
    padded.putdata(new_data)
    
    # Remove padding
    final_img = padded.crop((1, 1, w+1, h+1))
    
    # Crop to bounding box
    bbox = final_img.getbbox()
    if bbox:
        final_img = final_img.crop(bbox)
        
    final_img.save(out_path, "PNG")
    print("Saved to", out_path)

remove_bg(
    'artifacts/instagram-clone/public/themes/camelon.png',
    'artifacts/instagram-clone/public/themes/pascal_transparent.png'
)
