"""
Generate fox icons (16, 48, 128px) and Chrome Web Store promotional images.
Requires Pillow: pip install pillow
"""
from PIL import Image, ImageDraw, ImageFont
import math, pathlib, zipfile, shutil

ROOT = pathlib.Path(__file__).parent
ICONS_DIR = ROOT / "icons"
STORE_DIR = ROOT / "store_assets"
STORE_DIR.mkdir(exist_ok=True)

# ── Colour palette ───────────────────────────────────────────────────────────
FOX_ORANGE  = (230, 100,  30)   # main fur
FOX_DARK    = (160,  55,  10)   # ear tips / markings
FOX_CREAM   = (255, 240, 210)   # muzzle / chest patch
FOX_BLACK   = ( 30,  30,  30)   # eyes / nose
WHITE       = (255, 255, 255)
BLUE        = ( 26, 115, 232)   # brand blue
DARK_BLUE   = ( 11,  87, 180)


# ── Fox icon renderer ────────────────────────────────────────────────────────
def draw_fox(size: int) -> Image.Image:
    """Draw a minimal but recognisable fox face centred in a rounded square."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = size

    # ── rounded-square background ──
    r = s // 5
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=r, fill=BLUE)

    # scale helper: all coords are in a 100×100 grid, mapped to actual size
    def sc(v): return int(v * s / 100)

    # ── outer ears (dark triangles) ──
    d.polygon([sc(18), sc(10), sc(5), sc(42), sc(35), sc(30)], fill=FOX_DARK)   # left
    d.polygon([sc(82), sc(10), sc(95), sc(42), sc(65), sc(30)], fill=FOX_DARK)  # right

    # ── orange head circle ──
    d.ellipse([sc(15), sc(22), sc(85), sc(85)], fill=FOX_ORANGE)

    # ── inner ear highlights ──
    d.polygon([sc(22), sc(18), sc(12), sc(40), sc(33), sc(32)], fill=FOX_ORANGE)
    d.polygon([sc(78), sc(18), sc(88), sc(40), sc(67), sc(32)], fill=FOX_ORANGE)

    # ── cream muzzle ──
    d.ellipse([sc(30), sc(54), sc(70), sc(84)], fill=FOX_CREAM)

    # ── eyes ──
    eye_r = max(1, sc(6))
    d.ellipse([sc(30) - eye_r, sc(42) - eye_r, sc(30) + eye_r, sc(42) + eye_r], fill=FOX_BLACK)
    d.ellipse([sc(70) - eye_r, sc(42) - eye_r, sc(70) + eye_r, sc(42) + eye_r], fill=FOX_BLACK)

    # eye shine
    if size >= 32:
        sh = max(1, sc(2))
        d.ellipse([sc(32) - sh, sc(40) - sh, sc(32) + sh, sc(40) + sh], fill=WHITE)
        d.ellipse([sc(72) - sh, sc(40) - sh, sc(72) + sh, sc(40) + sh], fill=WHITE)

    # ── nose ──
    nose_r = max(1, sc(4))
    d.ellipse([sc(50) - nose_r, sc(60) - nose_r, sc(50) + nose_r, sc(60) + nose_r], fill=FOX_BLACK)

    # ── smile lines ──
    if size >= 32:
        lw = max(1, size // 32)
        d.line([sc(50), sc(60), sc(38), sc(68)], fill=FOX_BLACK, width=lw)
        d.line([sc(50), sc(60), sc(62), sc(68)], fill=FOX_BLACK, width=lw)

    return img


# ── Generate icons ───────────────────────────────────────────────────────────
for sz in (16, 48, 128):
    path = ICONS_DIR / f"icon{sz}.png"
    draw_fox(sz).save(path, "PNG")
    print(f"  icon{sz}.png")

# Also save a 512px version for the store listing
large = draw_fox(512)
large.save(STORE_DIR / "icon512.png", "PNG")
print("  store_assets/icon512.png")


# ── Promo tile builder ───────────────────────────────────────────────────────
def make_promo(w: int, h: int, filename: str):
    img = Image.new("RGB", (w, h), BLUE)
    d = ImageDraw.Draw(img)

    # gradient-ish background: darker strip at bottom
    for y in range(h):
        alpha = y / h
        r = int(BLUE[0] * (1 - alpha * 0.3) + DARK_BLUE[0] * alpha * 0.3)
        g = int(BLUE[1] * (1 - alpha * 0.3) + DARK_BLUE[1] * alpha * 0.3)
        b = int(BLUE[2] * (1 - alpha * 0.3) + DARK_BLUE[2] * alpha * 0.3)
        d.line([(0, y), (w, y)], fill=(r, g, b))

    # fox icon on the left
    icon_size = min(h - 40, 200)
    fox = draw_fox(icon_size)
    fox_x = 30
    fox_y = (h - icon_size) // 2
    img.paste(fox, (fox_x, fox_y), fox)

    # text block on the right
    tx = fox_x + icon_size + 30
    ty = h // 2

    # Try to use a system font, fall back to default
    try:
        font_title = ImageFont.truetype("arial.ttf", max(18, h // 10))
        font_sub   = ImageFont.truetype("arial.ttf", max(11, h // 18))
        font_brand = ImageFont.truetype("arial.ttf", max(9,  h // 24))
    except OSError:
        font_title = ImageFont.load_default()
        font_sub   = font_title
        font_brand = font_title

    d.text((tx, ty - h // 6), "Maps UTM Lead Finder",
           fill=WHITE, font=font_title)
    d.text((tx, ty - h // 6 + max(22, h // 9)),
           "Find businesses with no UTM tracking\non Google Maps — export leads to CSV",
           fill=(200, 220, 255), font=font_sub)
    d.text((tx, h - 24), "foxdigital.co.il",
           fill=(150, 190, 255), font=font_brand)

    img.save(STORE_DIR / filename, "PNG")
    print(f"  store_assets/{filename}")


make_promo(440, 280, "promo_small_440x280.png")
make_promo(920, 680, "promo_large_920x680.png")
make_promo(1280, 800, "screenshot_1280x800.png")


# ── Zip the extension ────────────────────────────────────────────────────────
zip_path = ROOT / "maps-utm-lead-finder.zip"
skip = {".git", "store_assets", "make_assets.py", "make_icons.py",
        "__pycache__", "maps-utm-lead-finder.zip"}

with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for f in ROOT.rglob("*"):
        if f.is_file() and not any(p in f.parts for p in skip):
            zf.write(f, f.relative_to(ROOT))
            print(f"  zip: {f.relative_to(ROOT)}")

print(f"\nDone. Extension zip: {zip_path}")
print(f"Store assets:        {STORE_DIR}")
