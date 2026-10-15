# Renders the Bebas Neue title PNGs in bio-assets/public/titles/ (pink #ff0066 with a glow, drawn at 2x).
# Needs Pillow and the Bebas Neue font: npm i @fontsource/bebas-neue in a scratch folder <dir>, then
# python3 bio-assets/make-titles.py <dir> bio-assets/public/titles   (it reads <dir>/fonts/node_modules/@fontsource/bebas-neue/...)
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
S,R=sys.argv[1],sys.argv[2]
FP=S+'/fonts/node_modules/@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff'
def render(text,size,track,pad):
    f=ImageFont.truetype(FP,size)
    widths=[f.getlength(c) for c in text]; W=int(sum(widths)+track*(len(text)-1))+pad*2
    asc,desc=f.getmetrics(); l,t,r,b=f.getbbox(text); H=b-t+pad*2
    m=Image.new('L',(W,H),0); d=ImageDraw.Draw(m); x=pad
    for c,w in zip(text,widths): d.text((x,pad-t),c,font=f,fill=255); x+=w+track
    glow=m.filter(ImageFilter.GaussianBlur(size*0.12)).point(lambda v:int(v*0.8))
    out=Image.new('RGBA',(W,H),(255,0,102,0)); out.putalpha(glow)
    solid=Image.new('RGBA',(W,H),(255,0,102,255)); solid.putalpha(m)
    return Image.alpha_composite(out,solid)
for name,text,size in [('caitie-rage','CAITIE RAGE',96),('afterlives','AFTERLIVES',68),('cam-pal','CAM PAL',68)]:
    im=render(text,size,4,int(size*0.22)); im.save(f'{R}/{name}.png',optimize=True); print(name,im.size)
