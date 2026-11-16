"""Cut the dance poses out of the sticker sheets in tobeused/girl/.

Each sticker on a sheet is a separate blob in the alpha channel, so we label
connected components, keep the one we want, clean up the soft fringe, and
upscale 2x (Lanczos) so the character stays sharp at 1080x1920.

Every pose is scaled by its *sheet's* standing height, so the character is the
same size no matter which sheet a pose came from. The bottom of each sprite is
the planted foot, which the video pins to the ground line.

  python3 -m pip install pillow numpy scipy
  python3 tools/extract_sprites.py
"""
import json, os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "..", "..", "tobeused", "girl")
OUT = os.path.join(HERE, "..", "public", "sprites")
SHEETS = {
    "ae7a": "ae7a24ad-5ce9-4147-8e6c-1a1820c69173.png",
    "9120": "9120c483-a13c-4a5d-ace3-b8845df51db7.png",
    "36b5": "36b5517e-0539-4e89-9d98-38f492ebef8f.png",
}
# Height (px) of a standing, full-body pose on each sheet.
STANDING = {"ae7a": 460, "9120": 405, "36b5": 445}

# name: (sheet, a point inside the sticker as (x, y) on the sheet)
POSES = {
    # Look A: black tank + pleated skirt
    "a_wave":    ("9120", (160, 200)),
    "a_selfie":  ("9120", (430, 200)),
    "a_selfie2": ("ae7a", (130, 200)),
    "a_jump":    ("ae7a", (1010, 200)),
    # Look B: rust top + grey jeans
    "b_point":   ("ae7a", (400, 200)),
    "b_thumbs":  ("36b5", (390, 200)),
    "b_peace":   ("36b5", (880, 200)),
    "b_cheer":   ("36b5", (390, 650)),
    "b_back":    ("ae7a", (150, 1100)),
    "b_jump":    ("9120", (160, 600)),
    # Look C: black crop tee + wide jeans
    "c_pocket":  ("ae7a", (740, 200)),
    "c_peace":   ("ae7a", (430, 700)),
    "c_point":   ("36b5", (620, 200)),
    "c_cute":    ("36b5", (910, 650)),
    "c_pocket2": ("9120", (1060, 200)),
}

def main():
    os.makedirs(OUT, exist_ok=True)
    cache, meta = {}, {}
    for name, (sheet, (px, py)) in POSES.items():
        if sheet not in cache:
            im = np.array(Image.open(os.path.join(SRC, SHEETS[sheet])).convert("RGBA"))
            mask = ndimage.binary_closing(im[:, :, 3] > 128, iterations=3)
            lab, _ = ndimage.label(mask)
            cache[sheet] = (im, lab)
        im, lab = cache[sheet]
        # nearest labelled pixel to the probe point
        win = lab[max(py - 40, 0):py + 40, max(px - 40, 0):px + 40]
        ids, counts = np.unique(win[win > 0], return_counts=True)
        idx = int(ids[np.argmax(counts)])
        ys, xs = ndimage.find_objects(lab == idx)[0]
        crop = im[ys, xs].astype(np.float32)
        keep = ndimage.binary_dilation(lab[ys, xs] == idx, iterations=2)
        a = crop[:, :, 3] * keep
        a[a < 40] = 0                      # drop the noisy halo
        crop[:, :, 3] = a
        sprite = Image.fromarray(crop.clip(0, 255).astype(np.uint8))
        # pad so the 2x Lanczos doesn't clip edges
        pad = Image.new("RGBA", (sprite.width + 8, sprite.height + 4), (0, 0, 0, 0))
        pad.paste(sprite, (4, 4))
        big = pad.resize((pad.width * 2, pad.height * 2), Image.LANCZOS)
        big = big.filter(ImageFilter.UnsharpMask(radius=1.6, percent=60, threshold=2))
        big.save(os.path.join(OUT, f"{name}.png"))
        meta[name] = {
            "w": big.width, "h": big.height,
            # size of this sprite relative to the standing character height
            "rel": round(sprite.height / STANDING[sheet], 4),
        }
        print(f"{name:10s} {sheet} {big.width}x{big.height} rel={meta[name]['rel']}")
    with open(os.path.join(HERE, "..", "src", "sprites.json"), "w") as f:
        json.dump(meta, f, indent=2)

if __name__ == "__main__":
    main()
