# Builds chaturbate-bio.html (every style inline, only <span>/<a>/<img>, since Chaturbate strips <style>, <div> and <table> styling).
# Run from the repo root: python3 bio-assets/build-bio.py bio-assets/chaturbate-bio.html
import sys
U="https://caitie-bio.caitie.workers.dev/"
CAMPAL_URL="https://chaturbate.com/v2apps/apps/4b45af59-cam-pal-virtual-pet"
PINK="#ff0066"; BG="#09090b"; CARD="#141418"; F="font-family:Arial,Helvetica,sans-serif;"
def blk(style,inner): return '<span style="display:block;%s">%s</span>' % (style,inner)
def txt(t,extra=""): return blk("margin:0 0 12px 0;color:#f4f4f5;font-size:15px;line-height:1.5;%s%s" % (F,extra), t)
def title(f,alt,w,h): return '<img src="%stitles/%s" alt="%s" width="%d" height="%d" style="width:%dpx;height:%dpx;display:block;margin:0 auto 6px auto;border:0;">' % (U,f,alt,w,h,w,h)
def mon(src,name,line):
    return ('<span style="display:inline-block;width:118px;vertical-align:top;margin:6px 4px;text-align:center;font-size:12px;line-height:1.35;color:#d4d4d8;%s">'
            '<img src="%s%s" alt="%s" width="96" height="96" style="width:96px;height:96px;object-fit:contain;image-rendering:pixelated;display:block;margin:0 auto 4px auto;border:0;">'
            '<span style="display:block;font-family:Impact,\'Arial Narrow Bold\',sans-serif;font-size:18px;letter-spacing:1px;color:%s;margin:0 0 2px 0;">%s</span>%s</span>') % (F,U,src,name,PINK,name,line)
def row(cells): return blk("text-align:center;margin:10px 0;", "".join(cells))
def badge(t, href=None, ref=True):
    st = "display:inline-block;background:%s;color:%s;font-weight:bold;font-size:12px;letter-spacing:1px;padding:3px 10px;border-radius:999px;margin:0 0 10px 0;text-decoration:none;%s" % (PINK,BG,F)
    if href:
        inner = '<a href="%s" target="_blank" rel="%s" style="%s">%s &#8599;</a>' % (href, "noopener noreferrer" if ref else "noopener", st, t)
    else:
        inner = '<span style="%s">%s</span>' % (st, t)
    return blk("text-align:center;", inner)
def btn(href,label,hot=False,ref=True):
    st=("display:inline-block;font-family:Impact,'Arial Narrow Bold',sans-serif;font-size:20px;letter-spacing:1.5px;text-decoration:none;"
        "padding:8px 18px;margin:5px;border-radius:999px;border:2px solid %s;color:%s;background:%s;") % (PINK, BG if hot else PINK, PINK if hot else BG)
    return '<a href="%s" target="_blank" rel="%s" style="%s">%s</a>' % (href,"noopener noreferrer" if ref else "noopener",st,label)
SEC="margin:22px 0 0 0;padding:18px 14px;border-radius:14px;background:%s;border:1px solid #2a2a31;text-align:center;" % CARD
afterlives = "".join([
  '<img src="%stown/noirleans.png" alt="The town of Noirleans" style="width:100%%;max-width:480px;height:auto;image-rendering:pixelated;border-radius:10px;display:block;margin:0 auto 14px auto;border:1px solid #2a2a31;">' % U,
  title('afterlives.png','Afterlives',152,39),
  txt("My indie game, made solo, from the code to the art. Adopt a cryptid, raise it into a legend and dress it in the most ridiculous hats. Noirleans is a moody little town where ghosts run the shops and nobody asks why the swamp hums."),
  row([mon("cryptids/ghost.png","Ghost","Haunts on purpose."),mon("cryptids/sasquatch.png","Sasquatch","Blurry in every photo."),
       mon("cryptids/swampMonster.png","Swamp Monster","Damp. Unbothered."),mon("cryptids/mothman.png","Mothman","Will fight your ring light."),
       mon("cryptids/jerseyDevil.png","Jersey Devil","Chaos with wings.")]),
  badge("V2 LANDS HALLOWEEN 2026", "https://afterlives.app/v2"),
  txt("30+ cryptids and a stack of new minigames. I can't wait to show you.")])
campal = "".join([
  title('cam-pal.png','Cam Pal',115,39), badge("FREE IN THE CHATURBATE APP LIBRARY", CAMPAL_URL, ref=False),
  txt("My own Chaturbate app, written, drawn and shipped by me. A sassy pixel pet moves into a see-through console in the corner of your stream and goes wild every time you get tipped."),
  row([mon("campal/peachy.png","Peachy","Knows her angles."),mon("campal/cherries.png","The Cherries","Always a double feature."),
       mon("campal/eggy.png","Eggy","Unimpressed. Secretly thrilled."),mon("campal/bananzo.png","Bananzo","Thumbs up, always.")]),
  "".join(txt(t,"margin:4px 0;") for t in ["Tips make it wink, blush, smooch the screen, twerk and party","Throws a confetti party when you hit your tip goal",
        "17 rooms, 8 console shapes, your pal, your name","Totally free for models. Thank-you tips are always welcome!"])])
inner = "".join([
  '<img src="%savatar.png" alt="Caitie Rage" width="132" height="132" style="width:132px;height:132px;border-radius:50%%;border:4px solid %s;object-fit:cover;display:block;margin:0 auto 12px auto;box-shadow:0 0 22px rgba(255,0,102,.55);">' % (U,PINK),
  title('caitie-rage.png','Caitie Rage',214,56),
  blk("margin:0 0 4px 0;color:#a1a1aa;font-size:14px;%s" % F, "Cam girl who codes. I made everything you see below."),
  txt("Between shows I design, draw and build my own games and apps. Come say hi, poke around, and stay a while."),
  blk(SEC, afterlives), blk(SEC, campal),
  blk("margin-top:22px;text-align:center;", "".join([btn("https://afterlives.app","Play Now",hot=True),btn("https://afterlives.app/v2","See V2"),
      btn("https://caitierage.myindustryhub.live","Linkhub",ref=False),btn("https://instagram.com/xcaitieragex","IG @xcaitieragex",ref=False),
      btn("https://x.com/CaitieRage","Twitter @CaitieRage",ref=False)])),
  blk("margin:22px 0 0 0;font-size:12px;color:#71717a;%s" % F, "18+ only."),
])
out = blk("background:%s;color:#f4f4f5;%sfont-size:15px;line-height:1.5;max-width:760px;margin:0 auto;padding:24px 18px;border:2px solid %s;border-radius:18px;text-align:center;" % (BG,F,PINK), "\n"+inner.replace("<span style=\"display:block;margin:22px","\n<span style=\"display:block;margin:22px")+"\n")
open(sys.argv[1],"w",encoding="utf-8").write(out+"\n")
