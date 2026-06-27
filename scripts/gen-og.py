import cairosvg, io
from PIL import Image, ImageDraw, ImageFont

LOGO_SVG = "web/public/press/logo-mark-dark.svg"
OUT      = "web/public/og-image.png"
LOGO_TARGET_H = 150

FONT = "/System/Library/Fonts/HelveticaNeue.ttc"
MONO = "/System/Library/Fonts/SFNSMono.ttf"
def font(idx, sz): return ImageFont.truetype(FONT, sz, index=idx)
def mono(sz):      return ImageFont.truetype(MONO, sz)

W, H = 1200, 630
BG   = (15, 18, 24)
INK  = (243, 244, 246)
MUTE = (150, 158, 170)
HAIR = (54, 60, 70)

png_bytes = cairosvg.svg2png(url=LOGO_SVG, output_height=LOGO_TARGET_H*3)
logo = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
ratio = LOGO_TARGET_H / logo.height
logo = logo.resize((int(logo.width*ratio), LOGO_TARGET_H), Image.LANCZOS)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)
MX = 90
d.line([(MX, 110), (W-MX, 110)], fill=HAIR, width=1)
d.line([(MX, 520), (W-MX, 520)], fill=HAIR, width=1)
img.paste(logo, ((W - logo.width)//2, 170), logo)

motto = "We don't rate.  We don't recommend.  We decompose."
mf = font(2, 34)   # Helvetica Neue Italic
mb = d.textbbox((0,0), motto, font=mf)
d.text(((W-(mb[2]-mb[0]))//2, 395), motto, font=mf, fill=MUTE)

d.text((MX, 545), "rwa-index.com", font=mono(26), fill=INK)
rt = "SARM · RARM"
rb = d.textbbox((0,0), rt, font=mono(26))
d.text((W-MX-(rb[2]-rb[0]), 545), rt, font=mono(26), fill=MUTE)

img.save(OUT, "PNG")
print("saved", img.size, "logo", logo.size)
