# Contact sheet de cuadros: python3 tools/sheet.py DIR OUT.jpg [cols] [scale]
import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 3
sc = float(sys.argv[4]) if len(sys.argv) > 4 else 0.33
fs = sorted(glob.glob(os.path.join(d, 'f*.jpg')))
if len(sys.argv) > 5:
    want = set(sys.argv[5].split(','))
    fs = [f for f in fs if str(int(os.path.basename(f)[1:5])) in want]
w, h = int(1920 * sc), int(1080 * sc)
rows = (len(fs) + cols - 1) // cols
sh = Image.new('RGB', (w * cols, h * rows), '#000')
dr = ImageDraw.Draw(sh)
for i, f in enumerate(fs):
    im = Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS)
    x, y = (i % cols) * w, (i // cols) * h
    sh.paste(im, (x, y))
    n = int(os.path.basename(f)[1:5])
    dr.text((x + 6, y + 4), f'f{n}  t={n/60:.3f}', fill='#ffff00')
sh.save(out, quality=88)
print(out, len(fs))
