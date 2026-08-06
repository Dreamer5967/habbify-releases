from PIL import Image

img = Image.open('public/logo.png').convert('RGBA')
width, height = img.size
pixels = img.load()

# Find the green box bounds
green_box_bottom = 0
for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        # The green box is something like (169, 245, 208)
        # We can just look for pixels with high green and low blue/red or just generally not black/transparent
        if a > 200 and g > 200 and r < 200:
            if y > green_box_bottom:
                green_box_bottom = y

print(f"Green box bottom is at y={green_box_bottom}")

# Now make black pixels white, only if they are below the green box
for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        # If it's below the green box (with a tiny margin)
        if y > green_box_bottom + 5:
            # If it's a dark pixel
            if a > 0 and r < 100 and g < 100 and b < 100:
                # We can just make it white, keeping the alpha
                pixels[x, y] = (255, 255, 255, a)

img.save('public/logo.png')
print("Saved fixed logo!")
