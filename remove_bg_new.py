from rembg import remove
from PIL import Image
import sys

def process_image(input_path, output_path):
    print("Opening image...")
    input_image = Image.open(input_path)
    print("Removing background with rembg...")
    output_image = remove(input_image)
    
    # Crop to bounding box
    bbox = output_image.getbbox()
    if bbox:
        output_image = output_image.crop(bbox)
        
    output_image.save(output_path, "PNG")
    print("Saved perfectly transparent image to", output_path)

if __name__ == "__main__":
    process_image(
        'camelon.png',
        'artifacts/instagram-clone/public/themes/camelon_final.png'
    )
