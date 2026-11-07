#!/usr/bin/env python3
"""Regenerate the NSIS installer bitmaps from the raster icon masters.

Sidebar (164x314): the 10router mark stacked over the wordmark on white,
matching the installer page background. Header (150x57): horizontal lockup.
Requires Pillow; macOS system fonts provide the wordmark face.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

DESKTOP = Path(__file__).resolve().parent.parent
MARK = DESKTOP / "src/images/icon.png"
SFNS = Path("/System/Library/Fonts/SFNS.ttf")
CHARCOAL = (36, 33, 31)
WHITE = (255, 255, 255)


def wordmark_font(size):
    font = ImageFont.truetype(str(SFNS), size)
    try:
        font.set_variation_by_name("SemiBold")
    except Exception:
        pass
    return font


def fit_font(text, max_width, start_size):
    size = start_size
    while size > 8:
        font = wordmark_font(size)
        bbox = font.getbbox(text)
        if bbox[2] - bbox[0] <= max_width:
            return font, bbox
        size -= 1
    raise RuntimeError(f"wordmark does not fit in {max_width}px")


def draw_wordmark(image, text, center_x, center_y, max_width):
    font, bbox = fit_font(text, max_width, 30)
    left, top, right, bottom = bbox
    text_w, text_h = right - left, bottom - top
    pos = (center_x - text_w / 2 - left, center_y - text_h / 2 - top)
    ImageDraw.Draw(image).text(pos, text, font=font, fill=CHARCOAL)


def sidebar():
    image = Image.new("RGB", (164, 314), WHITE)
    mark = Image.open(MARK).convert("RGB").resize((92, 92), Image.LANCZOS)
    image.paste(mark, ((164 - 92) // 2, 76))
    draw_wordmark(image, "10router", 82, 212, 140)
    return image


def header():
    image = Image.new("RGB", (150, 57), WHITE)
    mark = Image.open(MARK).convert("RGB").resize((40, 40), Image.LANCZOS)
    image.paste(mark, (10, (57 - 40) // 2))
    draw_wordmark(image, "10router", (50 + 150) / 2, 57 / 2, 150 - 50 - 2 * 6)
    return image


def save(image, path):
    try:
        image.save(path, dpi=(96, 96))
    except TypeError:
        image.save(path)


if __name__ == "__main__":
    save(sidebar(), DESKTOP / "electron-builder.nsis.sidebar.bmp")
    save(header(), DESKTOP / "electron-builder.nsis.header.bmp")
