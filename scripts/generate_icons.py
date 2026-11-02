import os
import io
import math
import base64
import urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter


def create_squircle_mask(size, radius):
    mask = Image.new('L', (size * 2, size * 2), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([0, 0, size * 2 - 1, size * 2 - 1], radius=radius * 2, fill=255)
    return mask.resize((size, size), Image.Resampling.LANCZOS)


def fetch_briefcase_emoji(size=512):
    # High-res 512x512 official Google Noto Color Emoji for 💼 (U+1F4BC)
    urls = [
        "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4bc/512.png",
        "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4bc.png"
    ]
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = resp.read()
                img = Image.open(io.BytesIO(data)).convert('RGBA')
                print(f"Downloaded briefcase emoji from {url} ({img.size})")
                return img
        except Exception as e:
            print(f"Could not fetch {url}: {e}")

    # Fallback: render using Windows Segoe UI Emoji
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/seguiemj.ttf", int(size * 0.7))
        draw.text((size // 2, size // 2), "💼", font=font, anchor="mm", embedded_color=True)
    except Exception as e:
        print(f"Font fallback error: {e}")
    return img


def generate_icon(base_emoji_img, size=512):
    # Option 1 - Stealth Charcoal (Monochromatic Formal radial gradient)
    # Center: (38, 40, 46) -> Edge: (9, 9, 11)
    canvas = Image.new('RGBA', (size, size))
    pixels = canvas.load()
    cx, cy = size / 2.0, size / 2.0
    max_radius = size * 0.68
    center_rgb = (38, 40, 46)
    outer_rgb = (9, 9, 11)

    for y in range(size):
        for x in range(size):
            dist = math.hypot(x - cx, y - cy)
            t = min(dist / max_radius, 1.0)
            smooth_t = (1 - math.cos(t * math.pi)) / 2.0
            r = int(center_rgb[0] * (1 - smooth_t) + outer_rgb[0] * smooth_t)
            g = int(center_rgb[1] * (1 - smooth_t) + outer_rgb[1] * smooth_t)
            b = int(center_rgb[2] * (1 - smooth_t) + outer_rgb[2] * smooth_t)
            pixels[x, y] = (r, g, b, 255)

    # Crop briefcase emoji to non-transparent bounding box so it is truly centered
    bbox = base_emoji_img.getbbox()
    cropped_emoji = base_emoji_img.crop(bbox) if bbox else base_emoji_img

    # Resize maintaining aspect ratio (target ~68% of canvas)
    if cropped_emoji.width >= cropped_emoji.height:
        target_w = int(size * 0.68)
        target_h = int(target_w * (cropped_emoji.height / cropped_emoji.width))
    else:
        target_h = int(size * 0.68)
        target_w = int(target_h * (cropped_emoji.width / cropped_emoji.height))

    emoji_resized = cropped_emoji.resize((target_w, target_h), Image.Resampling.LANCZOS)
    offset_x = (size - target_w) // 2
    offset_y = (size - target_h) // 2

    # Soft drop shadow under briefcase for depth
    shadow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    alpha = emoji_resized.split()[3]
    black_sil = Image.new('RGBA', emoji_resized.size, (0, 0, 0, 130))
    shadow.paste(black_sil, (offset_x, offset_y + int(size * 0.025)), alpha)
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=size * 0.035))
    canvas = Image.alpha_composite(canvas, shadow)

    # Paste centered briefcase
    canvas.paste(emoji_resized, (offset_x, offset_y), emoji_resized)

    # Subtle inner border for squircle definition
    border = Image.new('RGBA', (size * 2, size * 2), (0, 0, 0, 0))
    db = ImageDraw.Draw(border)
    rad = int(size * 0.22) * 2
    db.rounded_rectangle([2, 2, size * 2 - 3, size * 2 - 3], radius=rad, outline=(72, 74, 84, 160), width=5)
    border_resized = border.resize((size, size), Image.Resampling.LANCZOS)
    canvas = Image.alpha_composite(canvas, border_resized)

    # Apply rounded squircle mask (radius = 22% of size)
    mask = create_squircle_mask(size, int(size * 0.22))
    final = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    final.paste(canvas, (0, 0), mask)
    return final


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_dir = os.path.join(root, 'public')
    os.makedirs(public_dir, exist_ok=True)

    base_emoji = fetch_briefcase_emoji(size=512)
    icon512 = generate_icon(base_emoji, size=512)

    pwa512_path = os.path.join(public_dir, 'pwa-512x512.png')
    icon512.save(pwa512_path, 'PNG')
    print('Saved pwa-512x512.png (Option 1 - Stealth Charcoal)')

    pwa192 = icon512.resize((192, 192), Image.Resampling.LANCZOS)
    pwa192.save(os.path.join(public_dir, 'pwa-192x192.png'), 'PNG')
    print('Saved pwa-192x192.png')

    apple180 = icon512.resize((180, 180), Image.Resampling.LANCZOS)
    apple180.save(os.path.join(public_dir, 'apple-touch-icon.png'), 'PNG')
    print('Saved apple-touch-icon.png')

    fav32 = icon512.resize((32, 32), Image.Resampling.LANCZOS)
    fav32.save(os.path.join(public_dir, 'favicon-32x32.png'), 'PNG')
    print('Saved favicon-32x32.png')

    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    icon512.save(
        os.path.join(public_dir, 'favicon.ico'),
        format='ICO',
        sizes=ico_sizes
    )
    print('Saved favicon.ico')

    with open(pwa512_path, 'rb') as f:
        b64_data = base64.b64encode(f.read()).decode('utf-8')

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_data}" x="0" y="0" width="512" height="512" />
</svg>
'''
    with open(os.path.join(public_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print('Saved favicon.svg')
    print('All Budgeter icons generated successfully!')


if __name__ == '__main__':
    main()
