from PIL import Image

logo = Image.open('public/logo-light.png').convert("RGBA")
l_w, l_h = logo.size

# Resize logo to fit inside 1024x1024 nicely with padding
max_dim = 800
scale = min(max_dim / l_w, max_dim / l_h)
new_w = int(l_w * scale)
new_h = int(l_h * scale)
resized_logo = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)

bg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
x = (1024 - new_w) // 2
y = (1024 - new_h) // 2

bg.paste(resized_logo, (x, y), resized_logo)
bg.save('build/icon.png')
print("Created build/icon.png")
