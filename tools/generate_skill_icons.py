#!/usr/bin/env python3
"""
Generate pixel-art skill icons for CLAWS.
70 icons: 10 generic + 15 per hero (4 heroes × 3 branches × 5 skills).
Output: individual 32x32 PNGs + spritesheet + index JSON.
"""

from PIL import Image, ImageDraw, ImageFilter
import math, os, json, random

SIZE = 32
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'icons')
os.makedirs(OUT, exist_ok=True)

BG = (12, 10, 18, 255)

# Palettes per element
P = {
    'fire':   {'c': (255,240,180), 'b': (255,180,40),  'm': (255,100,20),  'd': (180,40,10),   'g': (255,120,30)},
    'ice':    {'c': (220,240,255), 'b': (120,200,255), 'm': (60,140,220),  'd': (30,70,150),   'g': (80,180,255)},
    'venom':  {'c': (180,255,120), 'b': (80,220,60),   'm': (40,160,40),   'd': (20,80,20),    'g': (60,200,50)},
    'shadow': {'c': (200,160,255), 'b': (140,80,220),  'm': (90,40,180),   'd': (50,20,100),   'g': (120,70,200)},
    'blade':  {'c': (230,230,240), 'b': (180,190,210), 'm': (120,130,150), 'd': (60,65,80),    'g': (200,210,230)},
    'gold':   {'c': (255,245,180), 'b': (255,210,80),  'm': (200,160,40),  'd': (140,100,20),  'g': (255,220,100)},
    'earth':  {'c': (220,190,150), 'b': (180,140,90),  'm': (130,100,60),  'd': (80,60,35),    'g': (200,160,100)},
    'steel':  {'c': (240,240,250), 'b': (200,200,220), 'm': (140,145,165), 'd': (80,80,100),   'g': (220,220,240)},
    'red':    {'c': (255,180,180), 'b': (255,80,80),   'm': (200,40,40),   'd': (120,20,20),   'g': (255,60,60)},
    'green':  {'c': (180,255,200), 'b': (60,220,100),  'm': (30,160,60),   'd': (15,90,30),    'g': (50,200,80)},
    'blue':   {'c': (180,200,255), 'b': (80,120,255),  'm': (40,60,200),   'd': (20,30,120),   'g': (60,100,255)},
}

def new():
    img = Image.new('RGBA', (SIZE, SIZE), BG)
    return img, ImageDraw.Draw(img)

def glow(img, color, intensity=1.0):
    gl = Image.new('RGBA', (SIZE, SIZE), (0,0,0,0))
    px, gp = img.load(), gl.load()
    for y in range(SIZE):
        for x in range(SIZE):
            r,g,b,a = px[x,y]
            br = (r+g+b)/3
            if br > 80 and a > 0:
                gp[x,y] = (color[0],color[1],color[2], int(min(255, br*0.5*intensity)))
    gl = gl.filter(ImageFilter.GaussianBlur(radius=2.5))
    res = Image.new('RGBA', (SIZE,SIZE), BG)
    res = Image.alpha_composite(res, gl)
    res = Image.alpha_composite(res, img)
    return res

def circ(d, cx, cy, r, col):
    for y in range(max(0,cy-r), min(SIZE,cy+r+1)):
        for x in range(max(0,cx-r), min(SIZE,cx+r+1)):
            if (x-cx)**2+(y-cy)**2 <= r**2:
                d.point((x,y), fill=col)

def diamond(d, cx, cy, r, col):
    pts = [(cx,cy-r),(cx+r,cy),(cx,cy+r),(cx-r,cy)]
    d.polygon(pts, fill=col)

def star5(d, cx, cy, r_out, r_in, col):
    pts = []
    for i in range(5):
        a = math.pi*2*i/5 - math.pi/2
        pts.append((int(cx+math.cos(a)*r_out), int(cy+math.sin(a)*r_out)))
        a2 = a + math.pi/5
        pts.append((int(cx+math.cos(a2)*r_in), int(cy+math.sin(a2)*r_in)))
    d.polygon(pts, fill=col)

def rays(d, cx, cy, r1, r2, count, col, w=1):
    for i in range(count):
        a = math.radians(i * 360/count)
        x1,y1 = int(cx+math.cos(a)*r1), int(cy+math.sin(a)*r1)
        x2,y2 = int(cx+math.cos(a)*r2), int(cy+math.sin(a)*r2)
        d.line([(x1,y1),(x2,y2)], fill=col, width=w)

def flame(d, cx, bot, h, p):
    """Draw a flame tongue: bottom-center up."""
    top = bot - h
    w = max(2, h//3)
    d.polygon([(cx-w, bot), (cx, top), (cx+w, bot)], fill=p['d'])
    d.polygon([(cx-w+1, bot-1), (cx, top+2), (cx+w-1, bot-1)], fill=p['m'])
    if h > 6:
        d.polygon([(cx-w+2, bot-2), (cx, top+4), (cx+w-2, bot-2)], fill=p['b'])
    if h > 10:
        d.line([(cx, top+3), (cx, bot-3)], fill=p['c'])

def shield(d, p, filled=True):
    pts = [(16,4),(26,8),(26,20),(16,28),(6,20),(6,8)]
    inner = [(16,6),(24,9),(24,19),(16,26),(8,19),(8,9)]
    d.polygon(pts, fill=p['d'], outline=p['m'])
    if filled:
        d.polygon(inner, fill=p['b'])

# ================================================================
# GENERIC G1-G10
# ================================================================
def g1():
    i,d=new()
    # Sword
    d.line([(10,24),(22,6)], fill=P['steel']['c'], width=2)
    d.line([(9,23),(21,5)], fill=(255,255,255,180), width=1)
    d.line([(8,20),(16,16)], fill=P['gold']['b'], width=2)
    d.line([(8,25),(10,23)], fill=P['earth']['m'], width=2)
    circ(d,7,26,1,P['gold']['b']); d.point((22,5),fill=(255,255,255))
    return glow(i, P['steel']['g'], 0.7)

def g2():
    i,d=new()
    d.polygon([(12,8),(20,8),(22,18),(24,22),(24,26),(8,26),(8,22),(12,18)], fill=P['earth']['m'], outline=P['earth']['d'])
    d.line([(13,9),(19,9)], fill=P['earth']['b']); d.line([(13,10),(13,16)], fill=P['earth']['b'])
    for j,y in enumerate([12,16,20]): d.line([(2,y),(8,y)], fill=P['blue']['b'], width=1)
    d.line([(20,10),(26,6)], fill=P['blue']['b']); d.line([(20,12),(25,9)], fill=P['blue']['m'])
    return glow(i, P['blue']['g'], 0.5)

def g3():
    i,d=new()
    d.polygon([(4,16),(16,8),(28,16),(16,24)], fill=P['steel']['d'], outline=P['steel']['m'])
    circ(d,16,16,5,P['gold']['m']); circ(d,16,16,3,P['gold']['b']); circ(d,16,16,2,(10,10,15))
    d.point((14,14),fill=(255,255,255)); d.point((15,14),fill=(255,255,255))
    return glow(i, P['gold']['g'], 0.9)

def g4():
    i,d=new()
    d.rounded_rectangle([(12,10),(24,24)], radius=3, fill=P['earth']['b'], outline=P['earth']['m'])
    for x in [14,17,20]: circ(d,x,12,2,P['earth']['c'])
    d.ellipse([(10,16),(14,22)], fill=P['earth']['b'])
    for j,y in enumerate([14,18,22]): d.line([(3+j,y),(10,y)], fill=P['gold']['b'])
    return glow(i, P['gold']['g'], 0.5)

def g5():
    i,d=new()
    d.polygon([(16,26),(6,14),(6,10),(8,7),(12,7),(16,11),(20,7),(24,7),(26,10),(26,14)], fill=P['red']['m'])
    d.polygon([(12,9),(9,9),(8,11),(8,13),(12,13)], fill=P['red']['b'])
    circ(d,16,14,3,P['red']['c']+(80,)); d.point((11,9),fill=(255,255,255))
    return glow(i, P['red']['g'], 1.0)

def g6():
    i,d=new()
    d.rectangle([(13,6),(19,26)], fill=P['green']['m']); d.rectangle([(7,12),(25,18)], fill=P['green']['m'])
    d.rectangle([(14,8),(18,24)], fill=P['green']['b']); d.rectangle([(9,13),(23,17)], fill=P['green']['b'])
    d.rectangle([(14,13),(18,17)], fill=P['green']['c'])
    for p in [(8,8),(24,8),(8,24),(24,24)]: d.point(p, fill=P['green']['c'])
    return glow(i, P['green']['g'], 0.8)

def g7():
    i,d=new()
    d.polygon([(6,10),(14,6),(18,10),(10,14)], fill=P['steel']['b'], outline=P['steel']['m'])
    d.line([(10,14),(6,26)], fill=P['earth']['m'], width=2)
    d.arc([(4,4),(28,28)], start=200, end=340, fill=P['steel']['c'], width=2)
    return glow(i, P['steel']['g'], 0.7)

def g8():
    i,d=new()
    star5(d, 16,16, 10,4, P['blue']['b'])
    star5(d, 16,16, 5,2, P['blue']['c'])
    circ(d,16,16,2,(255,255,255))
    return glow(i, P['blue']['g'], 1.0)

def g9():
    i,d=new()
    d.line([(8,6),(24,26)], fill=P['steel']['c'], width=2); d.line([(24,6),(8,26)], fill=P['steel']['c'], width=2)
    d.line([(7,6),(23,26)], fill=(255,255,255,150)); d.line([(23,6),(7,26)], fill=(255,255,255,150))
    circ(d,16,16,3,P['gold']['b']+(120,)); circ(d,16,16,1,(255,255,255))
    return glow(i, P['steel']['g'], 0.8)

def g10():
    i,d=new()
    shield(d, P['steel'])
    diamond(d,16,15,4,P['gold']['b']); diamond(d,16,15,2,P['gold']['c'])
    d.line([(10,9),(12,8)], fill=(255,255,255,180))
    return glow(i, P['steel']['g'], 0.6)

# ================================================================
# IGNARA — Inferno (IF), Fortress (IO), Havoc (IH)
# ================================================================
F = P['fire']

def if1():
    i,d=new()
    d.polygon([(16,24),(4,6),(28,6)], fill=F['d']); d.polygon([(16,22),(6,8),(26,8)], fill=F['m'])
    d.polygon([(16,20),(10,10),(22,10)], fill=F['b']); d.polygon([(16,18),(13,12),(19,12)], fill=F['c'])
    d.line([(4,4),(2,6)], fill=F['c']); d.line([(28,4),(30,6)], fill=F['c'])
    return glow(i, F['g'], 1.0)

def if2():
    i,d=new()
    d.polygon([(12,28),(16,2),(20,28)], fill=F['d']); d.polygon([(13,26),(16,4),(19,26)], fill=F['m'])
    d.polygon([(14,24),(16,6),(18,24)], fill=F['b']); d.polygon([(15,22),(16,8),(17,22)], fill=F['c'])
    d.polygon([(12,6),(16,2),(20,6)], fill=F['c'])
    return glow(i, F['g'], 0.9)

def if3():
    i,d=new()
    d.polygon([(8,28),(16,4),(24,28)], fill=F['d']); d.polygon([(10,26),(16,6),(22,26)], fill=F['m'])
    d.polygon([(12,24),(16,8),(20,24)], fill=(255,255,240)); d.polygon([(14,22),(16,10),(18,22)], fill=(255,255,255))
    d.point((16,4),fill=(255,255,255)); d.point((15,5),fill=(255,255,255))
    return glow(i, (255,240,200), 1.3)

def if4():
    i,d=new()
    d.rectangle([(2,20),(30,28)], fill=P['earth']['d']); d.ellipse([(4,18),(28,26)], fill=(60,30,10))
    for x in [8,14,20,26]:
        h=6+(x%7); d.polygon([(x-2,20),(x,20-h),(x+2,20)], fill=F['m']); d.polygon([(x-1,20),(x,20-h+2),(x+1,20)], fill=F['b'])
    for p in [(6,12),(18,8),(24,10)]: d.point(p, fill=F['c'])
    return glow(i, F['g'], 0.8)

def if5():
    i,d=new()
    for cx in [8,16,24]:
        d.polygon([(cx-3,28),(cx,4),(cx+3,28)], fill=F['d']); d.polygon([(cx-2,26),(cx,6),(cx+2,26)], fill=F['m'])
        d.polygon([(cx-1,24),(cx,8),(cx+1,24)], fill=F['b'])
    d.line([(11,12),(13,14)], fill=F['c']); d.line([(19,10),(21,12)], fill=F['c'])
    return glow(i, F['g'], 1.1)

def io1():
    i,d=new()
    shield(d, F)
    flame(d, 16, 22, 12, F)
    return glow(i, F['g'], 0.8)

def io2():
    i,d=new()
    d.polygon([(16,26),(8,16),(8,12),(10,9),(13,9),(16,13),(19,9),(22,9),(24,12),(24,16)], fill=P['red']['m'])
    d.polygon([(10,12),(13,4),(16,10),(19,4),(22,12)], fill=F['m'])
    d.polygon([(12,10),(14,5),(16,9),(18,5),(20,10)], fill=F['b'])
    return glow(i, F['g'], 0.9)

def io3():
    i,d=new()
    circ(d,16,12,4,F['d']); d.rectangle([(14,16),(18,24)], fill=F['d'])
    rays(d, 16,16, 5,12, 8, F['m']); circ(d,16,16,3,F['b']+(100,))
    return glow(i, F['g'], 1.0)

def io4():
    i,d=new()
    d.arc([(4,4),(28,28)], 0,360, fill=F['m'], width=2); d.arc([(6,6),(26,26)], 0,360, fill=F['b'], width=1)
    flame(d, 16, 22, 10, F)
    for a in [30,90,150,210,270,330]:
        r=math.radians(a); d.point((int(16+math.cos(r)*12), int(16+math.sin(r)*12)), fill=F['c'])
    return glow(i, F['g'], 0.9)

def io5():
    i,d=new()
    # Phoenix
    d.polygon([(16,14),(4,8),(8,20)], fill=F['m']); d.polygon([(16,14),(28,8),(24,20)], fill=F['m'])
    d.polygon([(16,14),(6,10),(10,18)], fill=F['b']); d.polygon([(16,14),(26,10),(22,18)], fill=F['b'])
    circ(d,16,14,3,F['c']); d.polygon([(14,18),(16,28),(18,18)], fill=F['m'])
    d.point((16,10),fill=(255,255,255)); d.point((15,11),fill=(255,255,255)); d.point((17,11),fill=(255,255,255))
    return glow(i, F['g'], 1.3)

def ih1():
    i,d=new()
    flame(d, 10, 22, 14, F)
    d.polygon([(20,14),(28,16),(20,18)], fill=F['c']); d.polygon([(18,10),(26,12),(18,14)], fill=F['b'])
    d.polygon([(18,18),(26,20),(18,22)], fill=F['b'])
    return glow(i, F['g'], 0.8)

def ih2():
    i,d=new()
    circ(d,16,12,8,F['d']); circ(d,16,12,6,F['m']); circ(d,16,12,4,F['b']); circ(d,16,12,2,F['c'])
    rays(d,16,12,6,12,12,F['b']); d.rectangle([(2,24),(30,28)], fill=P['earth']['d'])
    return glow(i, F['g'], 1.2)

def ih3():
    i,d=new()
    for j,(x,y) in enumerate([(8,24),(14,18),(20,12),(26,6)]):
        s=max(1,3-j); c=F['m'] if j<2 else F['d']
        circ(d,x,y,s,c)
        if j<2: circ(d,x,y,max(1,s-1),F['b'])
    d.polygon([(6,24),(8,18),(10,24)], fill=F['b'])
    return glow(i, F['g'], 0.7)

def ih4():
    i,d=new()
    for x,y in [(8,10),(16,16),(24,10),(12,22),(20,22)]:
        flame(d, x, y+4, 8, F)
    d.line([(10,12),(14,14)], fill=F['d']); d.line([(18,14),(22,12)], fill=F['d'])
    return glow(i, F['g'], 1.0)

def ih5():
    i,d=new()
    # Skull on fire
    circ(d,16,16,7,P['earth']['b']); circ(d,16,16,6,P['earth']['c'])
    circ(d,13,14,2,F['b']); circ(d,19,14,2,F['b']); circ(d,13,14,1,F['c']); circ(d,19,14,1,F['c'])
    d.point((15,17),fill=P['earth']['d']); d.point((17,17),fill=P['earth']['d'])
    d.line([(12,20),(20,20)], fill=P['earth']['d'])
    for x in [13,15,17,19]: d.line([(x,19),(x,21)], fill=P['earth']['d'])
    d.polygon([(10,10),(12,2),(14,10)], fill=F['m']); d.polygon([(18,10),(20,2),(22,10)], fill=F['m'])
    d.polygon([(14,10),(16,4),(18,10)], fill=F['b'])
    return glow(i, F['g'], 1.1)

# ================================================================
# NAZAR — Blade (NB), Venom (NV), Shadow (NS)
# ================================================================
B, V, S = P['blade'], P['venom'], P['shadow']

def nb1():
    i,d=new()
    d.polygon([(4,20),(16,14),(28,8)], fill=B['d']+(100,))
    d.line([(20,6),(24,16)], fill=B['b'], width=2); d.line([(24,16),(22,26)], fill=B['b'], width=2)
    d.line([(8,10),(12,20)], fill=B['d']+(80,), width=2)
    d.line([(22,4),(28,10)], fill=B['c']); d.point((22,4),fill=(255,255,255))
    return glow(i, B['g'], 0.6)

def nb2():
    i,d=new()
    d.line([(6,26),(20,4)], fill=B['c'], width=2); d.line([(12,4),(26,26)], fill=B['c'], width=2)
    d.line([(5,26),(19,4)], fill=(255,255,255,150)); d.line([(11,4),(25,26)], fill=(255,255,255,150))
    d.line([(5,22),(9,20)], fill=P['gold']['b']); d.line([(23,20),(27,22)], fill=P['gold']['b'])
    return glow(i, B['g'], 0.7)

def nb3():
    i,d=new()
    d.line([(4,24),(12,12)], fill=B['m'], width=2); d.line([(12,12),(20,20)], fill=B['m'], width=2)
    d.line([(20,20),(28,8)], fill=B['b'], width=2); d.polygon([(26,4),(30,8),(26,8)], fill=B['c'])
    circ(d,12,12,2,B['b']+(120,)); circ(d,20,20,2,B['b']+(120,))
    return glow(i, B['g'], 0.6)

def nb4():
    i,d=new()
    d.line([(6,6),(26,26)], fill=B['c'], width=2)
    for px,py in [(20,10),(24,14),(14,18),(18,22)]:
        circ(d,px,py,2,P['red']['b']); circ(d,px,py,1,P['red']['c'])
    d.line([(20,12),(20,16)], fill=P['red']['m']); d.line([(24,16),(24,20)], fill=P['red']['m'])
    return glow(i, P['red']['g'], 0.8)

def nb5():
    i,d=new()
    d.polygon([(14,4),(16,4),(18,18),(16,20),(14,18)], fill=B['c'])
    d.line([(15,4),(15,16)], fill=(255,255,255,120))
    d.line([(10,18),(22,18)], fill=P['gold']['b'], width=2)
    d.rectangle([(14,20),(18,26)], fill=P['earth']['m'])
    d.point((16,2),fill=(255,50,50)); d.point((15,3),fill=(255,50,50)); d.point((17,3),fill=(255,50,50))
    return glow(i, (255,200,200), 0.8)

def nv1():
    i,d=new()
    d.ellipse([(4,18),(28,28)], fill=V['d']); d.ellipse([(6,19),(26,27)], fill=V['m']); d.ellipse([(10,21),(22,25)], fill=V['b'])
    circ(d,12,20,2,V['c']); circ(d,20,22,1,V['c'])
    d.line([(8,8),(24,14)], fill=B['c'], width=2)
    return glow(i, V['g'], 0.9)

def nv2():
    i,d=new()
    d.ellipse([(2,14),(30,28)], fill=V['d']); d.ellipse([(4,16),(28,26)], fill=V['m'])
    for x in [10,16,22]: d.line([(x,14),(x-1,8)], fill=V['b']+(120,)); d.line([(x-1,8),(x+1,4)], fill=V['m']+(80,))
    d.line([(2,20),(0,20)], fill=V['b']); d.line([(30,20),(31,20)], fill=V['b'])
    return glow(i, V['g'], 0.8)

def nv3():
    i,d=new()
    circ(d,16,12,5,V['m']); circ(d,13,11,1,(10,10,10)); circ(d,19,11,1,(10,10,10))
    d.line([(13,15),(19,15)], fill=(10,10,10))
    for px,py in [(6,20),(12,24),(20,24),(26,20),(8,8),(24,8)]: circ(d,px,py,2,V['b'])
    d.line([(16,17),(12,22)], fill=V['d']); d.line([(16,17),(20,22)], fill=V['d'])
    return glow(i, V['g'], 1.0)

def nv4():
    i,d=new()
    d.line([(10,6),(16,14)], fill=B['m'], width=2); d.line([(16,14),(18,16)], fill=B['d'])
    d.line([(13,8),(13,14)], fill=V['b']); circ(d,13,16,1,V['b'])
    d.polygon([(12,24),(16,30),(20,24)], fill=V['m']); d.line([(16,14),(16,24)], fill=V['m'], width=2)
    return glow(i, V['g'], 0.7)

def nv5():
    i,d=new()
    circ(d,16,14,6,V['d']); circ(d,16,14,5,V['m'])
    circ(d,13,12,2,(10,10,10)); circ(d,19,12,2,(10,10,10))
    d.line([(12,18),(20,18)], fill=(10,10,10))
    for j,x in enumerate([6,10,22,26]):
        h=4+j*3; d.rectangle([(x,28-h),(x+2,28)], fill=V['b'] if j>1 else V['m'])
    return glow(i, V['g'], 1.1)

def ns1():
    i,d=new()
    d.polygon([(12,6),(20,6),(22,20),(20,28),(12,28),(10,20)], fill=S['m']+(120,))
    d.polygon([(13,8),(19,8),(20,18),(19,24),(13,24),(12,18)], fill=S['b']+(80,))
    d.point((14,14),fill=S['c']); d.point((18,14),fill=S['c'])
    return glow(i, S['g'], 0.8)

def ns2():
    i,d=new()
    for j,(x,a) in enumerate([(8,60),(16,120),(24,200)]):
        col=S['b'][:3]+(a,); d.rectangle([(x-3,8),(x+3,24)], fill=col); circ(d,x,8,3,col)
    d.line([(8,16),(24,16)], fill=S['m']+(100,))
    return glow(i, S['g'], 0.7)

def ns3():
    i,d=new()
    circ(d,14,16,7,S['d']); circ(d,18,14,6,S['d']); circ(d,16,18,5,S['m']+(150,))
    d.rectangle([(14,20),(18,24)], fill=(60,60,60)); d.line([(16,20),(16,16)], fill=F['b'])
    d.point((16,15),fill=F['c'])
    return glow(i, S['g'], 0.8)

def ns4():
    i,d=new()
    d.polygon([(4,16),(16,10),(28,16),(16,22)], fill=S['d'], outline=S['m'])
    circ(d,16,16,4,P['red']['m']); circ(d,16,16,2,P['red']['b']); circ(d,16,16,1,(10,10,10))
    d.line([(16,22),(16,28)], fill=P['red']['b']); circ(d,16,28,1,P['red']['m'])
    return glow(i, P['red']['g'], 0.8)

def ns5():
    i,d=new()
    d.arc([(4,4),(28,28)], 0,360, fill=S['m'], width=1); d.arc([(8,8),(24,24)], 0,360, fill=S['b'], width=1)
    d.line([(16,4),(16,12)], fill=S['m']); d.line([(16,20),(16,28)], fill=S['m'])
    d.line([(4,16),(12,16)], fill=S['m']); d.line([(20,16),(28,16)], fill=S['m'])
    circ(d,16,16,3,S['c']); d.point((15,15),fill=(10,10,10)); d.point((17,15),fill=(10,10,10))
    return glow(i, S['g'], 1.0)

# ================================================================
# SIFRA — Frost (SF), Shatter (SS), Crystal (SC)
# ================================================================
IC = P['ice']

def sf1():
    i,d=new()
    for a in range(0,360,60):
        r=math.radians(a); ex,ey=int(16+math.cos(r)*11),int(16+math.sin(r)*11)
        d.line([(16,16),(ex,ey)], fill=IC['b'])
        for br in [0.5,0.7]:
            bx,by=int(16+math.cos(r)*11*br),int(16+math.sin(r)*11*br)
            for da in [30,-30]:
                br2=math.radians(a+da)
                d.line([(bx,by),(bx+int(math.cos(br2)*3),by+int(math.sin(br2)*3))], fill=IC['m'])
    circ(d,16,16,2,IC['c'])
    return glow(i, IC['g'], 1.0)

def sf2():
    i,d=new()
    d.arc([(4,4),(28,28)], 0,360, fill=IC['m'], width=2); d.arc([(6,6),(26,26)], 0,360, fill=IC['b']+(120,), width=1)
    for a in range(0,360,40):
        r=math.radians(a); d.point((int(16+math.cos(r)*10),int(16+math.sin(r)*10)), fill=IC['c'])
    circ(d,16,16,3,IC['d']); circ(d,16,16,2,IC['m'])
    return glow(i, IC['g'], 0.9)

def sf3():
    i,d=new()
    for a in range(0,360,45):
        r=math.radians(a); pr=math.radians(a+90)
        cx,cy_=int(16+math.cos(r)*8),int(16+math.sin(r)*8)
        ex,ey=int(16+math.cos(r)*13),int(16+math.sin(r)*13)
        px,py=int(math.cos(pr)*2),int(math.sin(pr)*2)
        d.polygon([(cx+px,cy_+py),(cx-px,cy_-py),(ex,ey)], fill=IC['b'])
    circ(d,16,16,4,IC['c']+(150,)); circ(d,16,16,2,(255,255,255))
    return glow(i, IC['g'], 1.1)

def sf4():
    i,d=new()
    d.polygon([(8,6),(24,6),(26,26),(6,26)], fill=IC['d']+(180,), outline=IC['m'])
    circ(d,16,12,3,IC['m']+(100,)); d.rectangle([(14,15),(18,22)], fill=IC['m']+(100,))
    for px,py in [(10,8),(22,10),(8,20),(24,18)]: d.point((px,py), fill=IC['c'])
    return glow(i, IC['g'], 0.8)

def sf5():
    i,d=new()
    d.arc([(2,8),(16,24)], 0,360, fill=IC['b'], width=2); d.arc([(16,8),(30,24)], 0,360, fill=IC['b'], width=2)
    for px,py in [(8,10),(24,10),(8,22),(24,22),(16,16)]: d.point((px,py), fill=IC['c'])
    d.line([(14,16),(18,16)], fill=IC['c']); d.line([(16,14),(16,18)], fill=IC['c'])
    return glow(i, IC['g'], 1.0)

def ss1():
    i,d=new()
    diamond(d,16,14,8,IC['m']); diamond(d,16,14,6,IC['b']); diamond(d,16,14,3,IC['c'])
    d.polygon([(24,22),(28,26),(26,22)], fill=P['red']['b'])
    return glow(i, IC['g'], 0.8)

def ss2():
    i,d=new()
    for a in range(0,360,50):
        r=math.radians(a); dist=8+(a%3)*2
        x,y=int(16+math.cos(r)*dist),int(16+math.sin(r)*dist)
        diamond(d,x,y,2+a%2,IC['b'])
    circ(d,16,16,4,IC['c']+(180,)); circ(d,16,16,2,(255,255,255))
    return glow(i, IC['g'], 1.2)

def ss3():
    i,d=new()
    d.polygon([(16,2),(22,16),(18,28),(14,28),(10,16)], fill=IC['m'], outline=IC['d'])
    d.polygon([(16,4),(20,16),(17,26),(15,26),(12,16)], fill=IC['b'])
    d.polygon([(16,6),(18,16),(16,24)], fill=IC['c'])
    d.point((16,2),fill=(255,255,255))
    return glow(i, IC['g'], 0.9)

def ss4():
    i,d=new()
    circ(d,16,16,8,P['red']['d']); circ(d,16,16,6,P['red']['m']+(150,))
    for px,py in [(12,12),(20,14),(16,20)]: circ(d,px,py,3,IC['b']+(150,))
    for px,py in [(8,8),(24,8),(8,24)]: d.point((px,py), fill=P['red']['c'])
    return glow(i, IC['g'], 0.8)

def ss5():
    i,d=new()
    for cx_,cy_,r in [(10,10,5),(20,14,6),(12,22,4),(24,22,5)]:
        circ(d,cx_,cy_,r,IC['d']+(100,)); circ(d,cx_,cy_,max(1,r-2),IC['m']+(120,))
    d.line([(14,12),(18,12)], fill=IC['c']); d.line([(18,18),(14,20)], fill=IC['c'])
    return glow(i, IC['g'], 1.0)

def sc1():
    i,d=new()
    d.polygon([(4,16),(10,13),(10,19)], fill=IC['c'])
    d.rectangle([(10,15),(28,17)], fill=IC['b']); d.rectangle([(10,14),(14,18)], fill=IC['m'])
    for x in [16,22]: d.arc([(x-3,12),(x+3,20)], 0,360, fill=P['red']['d']+(100,), width=1)
    return glow(i, IC['g'], 0.7)

def sc2():
    i,d=new()
    shield(d, IC)
    diamond(d,16,15,4,IC['b']); diamond(d,16,15,2,IC['c'])
    return glow(i, IC['g'], 0.8)

def sc3():
    i,d=new()
    d.line([(4,8),(14,20)], fill=IC['b'], width=2); d.line([(14,20),(28,10)], fill=IC['b'], width=2)
    d.line([(14,18),(14,28)], fill=P['steel']['m'], width=2)
    diamond(d,28,10,3,IC['c']); d.point((14,20),fill=(255,255,255))
    return glow(i, IC['g'], 0.7)

def sc4():
    i,d=new()
    circ(d,16,14,4,IC['d']); d.line([(4,10),(12,14)], fill=P['red']['b'])
    for a in [30,90,150]:
        r=math.radians(a); ex,ey=int(16+math.cos(r)*12),int(14+math.sin(r)*12)
        d.line([(16,14),(ex,ey)], fill=IC['b']); diamond(d,ex,ey,2,IC['c'])
    return glow(i, IC['g'], 0.9)

def sc5():
    i,d=new()
    diamond(d,16,10,4,IC['b']); diamond(d,16,10,2,IC['c'])
    d.line([(16,14),(8,24)], fill=IC['m']); d.line([(16,14),(16,26)], fill=IC['m']); d.line([(16,14),(24,24)], fill=IC['m'])
    diamond(d,8,24,2,IC['b']); diamond(d,16,26,2,IC['b']); diamond(d,24,24,2,IC['b'])
    return glow(i, IC['g'], 0.9)

# ================================================================
# AMUN — Quake (AQ), Bastion (AB), Sovereign (AS)
# ================================================================
G, E = P['gold'], P['earth']

def aq1():
    i,d=new()
    d.arc([(2,2),(30,30)], 0,360, fill=G['b'], width=2); d.arc([(6,6),(26,26)], 0,360, fill=G['m'], width=2)
    d.arc([(10,10),(22,22)], 0,360, fill=G['c']+(150,), width=1); circ(d,16,16,3,G['c'])
    return glow(i, G['g'], 1.0)

def aq2():
    i,d=new()
    d.rectangle([(2,16),(30,28)], fill=E['m'])
    d.line([(16,16),(10,22)], fill=E['d'], width=2); d.line([(16,16),(22,24)], fill=E['d'], width=2)
    d.line([(16,16),(16,28)], fill=E['d'], width=2)
    for px,py in [(8,8),(16,6),(24,8)]: d.point((px,py), fill=G['c'])
    return glow(i, G['g'], 0.8)

def aq3():
    i,d=new()
    d.rounded_rectangle([(8,6),(24,22)], radius=3, fill=G['m'], outline=G['d'])
    for x in [11,15,19]: circ(d,x,8,2,G['b'])
    d.polygon([(26,14),(30,16),(26,18)], fill=G['c'])
    d.arc([(0,14),(8,30)], 270,90, fill=G['c'], width=1)
    return glow(i, G['g'], 0.9)

def aq4():
    i,d=new()
    d.polygon([(6,14),(6,18),(20,22),(24,24),(24,8),(20,10)], fill=G['m'])
    d.polygon([(8,15),(8,17),(18,20),(18,12)], fill=G['b'])
    d.arc([(22,8),(30,24)], 270,90, fill=G['c'], width=1)
    d.point((28,14),fill=G['c']); d.point((30,16),fill=G['c'])
    return glow(i, G['g'], 0.8)

def aq5():
    i,d=new()
    d.arc([(2,2),(30,30)], 0,360, fill=G['b'], width=2); d.arc([(8,8),(24,24)], 0,360, fill=G['c'], width=2)
    rays(d,16,16,6,13,8,G['m']); circ(d,16,16,2,(255,255,255))
    return glow(i, G['g'], 1.2)

def ab1():
    i,d=new()
    shield(d, E)
    d.arc([(2,2),(30,30)], 0,360, fill=G['b']+(80,), width=1); diamond(d,16,14,3,G['b'])
    return glow(i, G['g'], 0.7)

def ab2():
    i,d=new()
    shield(d, E, filled=True)
    for a in [0,60,120,180,240,300]:
        r=math.radians(a)
        bx,by=int(16+math.cos(r)*10),int(16+math.sin(r)*10)
        tx,ty=int(16+math.cos(r)*15),int(16+math.sin(r)*15)
        d.line([(bx,by),(tx,ty)], fill=P['red']['b']); d.point((tx,ty),fill=P['red']['c'])
    return glow(i, P['red']['g'], 0.7)

def ab3():
    i,d=new()
    d.line([(4,16),(28,16)], fill=G['b'], width=2)
    d.line([(10,4),(10,14)], fill=P['red']['b']); d.polygon([(8,14),(10,16),(12,14)], fill=P['red']['b'])
    d.line([(22,4),(22,14)], fill=P['red']['b']); d.polygon([(20,14),(22,16),(24,14)], fill=P['red']['b'])
    d.rectangle([(4,18),(28,28)], fill=G['d']+(60,)); circ(d,16,22,3,G['b']+(100,))
    return glow(i, G['g'], 0.8)

def ab4():
    i,d=new()
    d.polygon([(16,24),(8,14),(8,11),(10,8),(13,8),(16,12),(19,8),(22,8),(24,11),(24,14)], fill=P['red']['m'])
    d.rectangle([(14,10),(18,22)], fill=P['green']['b']+(150,)); d.rectangle([(10,14),(22,18)], fill=P['green']['b']+(150,))
    d.point((10,8),fill=P['green']['c']); d.point((22,8),fill=P['green']['c'])
    return glow(i, P['green']['g'], 0.8)

def ab5():
    i,d=new()
    d.polygon([(16,14),(2,6),(6,20)], fill=G['m']); d.polygon([(16,14),(30,6),(26,20)], fill=G['m'])
    d.polygon([(16,14),(4,8),(8,18)], fill=G['b']); d.polygon([(16,14),(28,8),(24,18)], fill=G['b'])
    d.arc([(11,4),(21,10)], 0,360, fill=G['c'], width=1)
    circ(d,16,14,3,G['c']); d.line([(16,17),(16,26)], fill=G['b'], width=2)
    return glow(i, G['g'], 1.2)

def as1():
    i,d=new()
    d.rounded_rectangle([(10,8),(22,24)], radius=2, fill=E['m'])
    d.arc([(4,4),(28,28)], 0,360, fill=G['b']+(100,), width=2)
    d.rectangle([(13,12),(19,14)], fill=P['red']['b']); d.rectangle([(15,10),(17,16)], fill=P['red']['b'])
    d.polygon([(14,20),(16,17),(18,20)], fill=G['c'])
    return glow(i, G['g'], 0.8)

def as2():
    i,d=new()
    for r,a in [(13,200),(10,150),(7,100),(4,50)]:
        d.arc([(16-r,16-r),(16+r,16+r)], 0,360, fill=G['b'][:3]+(a,), width=1)
    for a in [0,90,180,270]:
        ra=math.radians(a); d.point((int(16+math.cos(ra)*14),int(16+math.sin(ra)*14)), fill=G['c'])
    circ(d,16,16,2,G['c'])
    return glow(i, G['g'], 0.9)

def as3():
    i,d=new()
    d.arc([(6,6),(26,26)], 0,360, fill=G['m'], width=1)
    rays(d,16,16,5,13,12,G['b']); circ(d,16,16,4,P['red']['b']+(120,)); circ(d,16,16,2,(255,255,255))
    return glow(i, G['g'], 1.1)

def as4():
    i,d=new()
    d.arc([(4,4),(28,28)], 0,360, fill=G['d'], width=1)
    for a in [0,60,120,180,240,300]:
        r=math.radians(a)
        ox,oy=int(16+math.cos(r)*13),int(16+math.sin(r)*13)
        ix,iy=int(16+math.cos(r)*7),int(16+math.sin(r)*7)
        d.line([(ox,oy),(ix,iy)], fill=G['b']); d.point((ix,iy),fill=G['c'])
    circ(d,16,16,4,S['d']); circ(d,16,16,2,G['c'])
    return glow(i, G['g'], 0.8)

def as5():
    i,d=new()
    d.polygon([(12,0),(20,0),(24,28),(8,28)], fill=G['m']+(100,))
    d.polygon([(14,0),(18,0),(22,28),(10,28)], fill=G['b']+(150,))
    d.polygon([(15,0),(17,0),(19,28),(13,28)], fill=G['c']+(200,))
    d.ellipse([(6,22),(26,30)], fill=G['c']+(120,))
    d.point((16,2),fill=(255,255,255)); d.point((15,3),fill=(255,255,255))
    return glow(i, G['g'], 1.3)

# ================================================================
# REGISTRY + BUILD
# ================================================================
ALL = {
    'g1_sharp_edge': g1, 'g2_swift_feet': g2, 'g3_eagle_eye': g3, 'g4_quick_hands': g4,
    'g5_vitality': g5, 'g6_regeneration': g6, 'g7_cleave': g7, 'g8_wisdom': g8,
    'g9_multistrike': g9, 'g10_iron_skin': g10,
    'if1_wide_burn': if1, 'if2_inferno_reach': if2, 'if3_white_fire': if3,
    'if4_scorched_earth': if4, 'if5_firestorm': if5,
    'io1_heat_shield': io1, 'io2_pyromaniac': io2, 'io3_molten_skin': io3,
    'io4_ember_veil': io4, 'io5_phoenix_heart': io5,
    'ih1_backdraft': ih1, 'ih2_eruption': ih2, 'ih3_lava_trail': ih3,
    'ih4_wildfire': ih4, 'ih5_meltdown': ih5,
    'nb1_shadow_step': nb1, 'nb2_twin_blades': nb2, 'nb3_chain_dash': nb3,
    'nb4_hemorrhage': nb4, 'nb5_assassinate': nb5,
    'nv1_toxic_slash': nv1, 'nv2_virulent_strain': nv2, 'nv3_pandemic': nv3,
    'nv4_weakness': nv4, 'nv5_necrosis': nv5,
    'ns1_vanish': ns1, 'ns2_phantom_trail': ns2, 'ns3_smoke_bomb': ns3,
    'ns4_blood_scent': ns4, 'ns5_death_mark': ns5,
    'sf1_deep_freeze': sf1, 'sf2_blizzard_aura': sf2, 'sf3_frost_nova': sf3,
    'sf4_absolute_zero': sf4, 'sf5_eternal_winter': sf5,
    'ss1_permafrost': ss1, 'ss2_shatter': ss2, 'ss3_ice_spear': ss3,
    'ss4_frostbite': ss4, 'ss5_avalanche': ss5,
    'sc1_glacial_pierce': sc1, 'sc2_ice_armor': sc2, 'sc3_mirror_ice': sc3,
    'sc4_cryo_shield': sc4, 'sc5_diamond_dust': sc5,
    'aq1_titans_pulse': aq1, 'aq2_earthquake': aq2, 'aq3_colossus': aq3,
    'aq4_rally_cry': aq4, 'aq5_cataclysm': aq5,
    'ab1_fortify': ab1, 'ab2_thorns': ab2, 'ab3_iron_will': ab3,
    'ab4_regenerate': ab4, 'ab5_undying': ab5,
    'as1_living_fortress': as1, 'as2_consecration': as2, 'as3_wrath': as3,
    'as4_gravity_well': as4, 'as5_divine_judgment': as5,
}

def main():
    print(f"Generating {len(ALL)} skill icons...")
    for name, fn in ALL.items():
        fn().save(os.path.join(OUT, f'{name}.png'))

    # Spritesheet (10 cols)
    cols = 10
    rows = math.ceil(len(ALL) / cols)
    sheet = Image.new('RGBA', (cols*SIZE, rows*SIZE), (0,0,0,0))
    for idx, (name, fn) in enumerate(ALL.items()):
        sheet.paste(fn(), ((idx%cols)*SIZE, (idx//cols)*SIZE))
    sheet.save(os.path.join(OUT, 'skill_icons_sheet.png'))

    # Preview (4x scale)
    sheet.resize((cols*SIZE*4, rows*SIZE*4), Image.NEAREST).save(os.path.join(OUT, 'skill_icons_preview.png'))

    # Index JSON
    with open(os.path.join(OUT, 'icon_index.json'), 'w') as f:
        json.dump({'size': SIZE, 'cols': cols, 'icons': list(ALL.keys())}, f, indent=2)

    print(f"Done! {len(ALL)} icons → {OUT}/")

if __name__ == '__main__':
    main()
