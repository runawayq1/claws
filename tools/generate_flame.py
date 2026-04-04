#!/usr/bin/env python3
"""
Generate pixel-art flamethrower spritesheet for CLAWS.
5 frames of flame animation, 48x16 per frame → 240x16 spritesheet.
Style: bright white-yellow core near muzzle, orange body, red/dark tips with scattered embers.
"""

from PIL import Image, ImageDraw, ImageFilter
import math
import random
import os

FRAME_W = 64
FRAME_H = 24
FRAMES = 5
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'vfx')
os.makedirs(OUT_DIR, exist_ok=True)

random.seed(42)

# Fire palette (indexed by heat: 0=hottest, higher=cooler)
PALETTE = [
    (255, 255, 240),  # 0 white-hot
    (255, 255, 180),  # 1 bright yellow-white
    (255, 230, 120),  # 2 yellow
    (255, 200, 60),   # 3 gold
    (255, 160, 30),   # 4 orange-yellow
    (255, 120, 15),   # 5 orange
    (240, 80, 10),    # 6 dark orange
    (200, 50, 5),     # 7 red-orange
    (160, 30, 5),     # 8 red
    (120, 20, 5),     # 9 dark red
    (80, 15, 5),      # 10 very dark red
    (50, 10, 3),      # 11 near-black ember
]

def noise(x, y, seed=0):
    """Simple deterministic noise."""
    n = math.sin(x * 127.1 + y * 311.7 + seed * 43758.5453) * 43758.5453
    return n - math.floor(n)


def draw_flame_frame(frame_idx):
    """Draw one frame of the flamethrower animation.
    Shape: narrow at muzzle → expanding body → big fireball bulge at tip.
    Style: bright white-yellow core, orange body, dark red edges with scattered embers.
    """
    img = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    phase = frame_idx * 0.35
    heat = [[0.0] * FRAME_W for _ in range(FRAME_H)]
    cy = FRAME_H / 2

    for x in range(FRAME_W):
        for y in range(FRAME_H):
            progress = x / FRAME_W  # 0=muzzle, 1=tip

            # Shape: narrow start → expanding → big bulge at end
            if progress < 0.08:
                # Tight muzzle
                max_width = 1.0 + progress * 25
            elif progress < 0.4:
                # Widening body
                max_width = 3.0 + (progress - 0.08) * 14
            elif progress < 0.75:
                # Big bulge/fireball at 60-80%
                bulge = math.sin((progress - 0.4) / 0.35 * math.pi) * 4
                max_width = 7.5 + bulge
            else:
                # Taper off at very end
                max_width = 10.0 - (progress - 0.75) * 30
                max_width = max(1.0, max_width)

            # Turbulence — different per frame for animation
            turb = noise(x * 0.25 + phase * 6, frame_idx * 5.3, 1) * 3.0
            turb += noise(x * 0.12 + phase * 3, y * 0.35 + phase, 2) * 2.0
            # Extra turbulence at tip for ragged edge
            if progress > 0.6:
                turb += noise(x * 0.5 + phase * 10, y * 0.8, 10 + frame_idx) * 3.0
            max_width += turb

            dist_from_center = abs(y - cy)
            if dist_from_center > max_width:
                continue

            # Heat: very hot at muzzle, warm in body, cooler at tip edges
            if progress < 0.3:
                base_heat = 1.0 - progress * 1.0  # 1.0 → 0.7
            elif progress < 0.7:
                base_heat = 0.7 - (progress - 0.3) * 0.5  # 0.7 → 0.5
            else:
                base_heat = 0.5 - (progress - 0.7) * 1.2  # 0.5 → 0.14

            # Sharper edge falloff — dark red at edges
            edge_ratio = dist_from_center / max(max_width, 0.01)
            edge_factor = 1.0 - edge_ratio ** 1.2
            edge_factor = max(0, min(1, edge_factor))

            # Noise layers
            n1 = noise(x * 0.35 + phase * 7, y * 0.45, 3)
            n2 = noise(x * 0.18 + phase * 3.5, y * 0.25, 4)
            n3 = noise(x * 0.7 + phase * 14, y * 0.9, 5 + frame_idx)

            heat_val = base_heat * edge_factor
            heat_val *= (0.55 + n1 * 0.45)
            heat_val += n2 * 0.12
            heat_val += n3 * 0.06

            # Bright core streak — thinner, more intense
            core_width = 1.2 if progress < 0.15 else (2.0 if progress < 0.5 else 2.8)
            if dist_from_center < core_width:
                core_boost = (1.0 - dist_from_center / core_width) * 0.4
                core_boost *= (1.0 - progress * 0.6)  # fade core toward tip
                heat_val += core_boost

            # Hot spots — bright clumps in the flame body
            if n3 > 0.8 and progress > 0.15 and progress < 0.85:
                heat_val += 0.25 * (1.0 - edge_ratio)

            # Bulge area gets extra bright hot spots
            if 0.5 < progress < 0.8 and n1 > 0.7 and edge_ratio < 0.5:
                heat_val += 0.15

            heat[y][x] = max(0, min(1, heat_val))

    # Scattered embers — more at tip
    embers = []
    for _ in range(20 + frame_idx * 4):
        ex = random.randint(int(FRAME_W * 0.2), FRAME_W - 1)
        spread = 10 if ex > FRAME_W * 0.6 else 7
        ey = int(cy + random.uniform(-spread, spread))
        if 0 <= ey < FRAME_H:
            embers.append((ex, ey, random.uniform(0.2, 0.65)))

    # Extra embers scattered far from tip
    for _ in range(12):
        ex = random.randint(int(FRAME_W * 0.65), FRAME_W - 1)
        ey = int(cy + random.uniform(-11, 11))
        if 0 <= ey < FRAME_H:
            embers.append((ex, ey, random.uniform(0.15, 0.5)))

    # Render to pixels
    pixels = img.load()
    for y in range(FRAME_H):
        for x in range(FRAME_W):
            h = heat[y][x]
            if h <= 0.01:
                continue

            idx = int((1.0 - h) * (len(PALETTE) - 1))
            idx = max(0, min(len(PALETTE) - 1, idx))
            r, g, b = PALETTE[idx]

            # Full alpha for hot, fading for edges — but keep dark reds visible
            if h > 0.3:
                alpha = 255
            elif h > 0.1:
                alpha = int(180 + h * 250)
                alpha = min(255, alpha)
            else:
                alpha = int(h * 1200)
                alpha = min(200, alpha)

            # Pixel-art dithering at very faint edges
            if h < 0.08 and noise(x, y, frame_idx * 7) > 0.4:
                continue

            pixels[x, y] = (r, g, b, alpha)

    # Draw embers
    for ex, ey, eh in embers:
        if 0 <= ex < FRAME_W and 0 <= ey < FRAME_H:
            idx = int((1.0 - eh) * (len(PALETTE) - 1))
            idx = max(0, min(len(PALETTE) - 1, idx))
            r, g, b = PALETTE[idx]
            alpha = int(min(255, eh * 400))
            cr, cg, cb, ca = pixels[ex, ey]
            if ca < alpha:
                pixels[ex, ey] = (r, g, b, alpha)

    # Muzzle flash: bright concentrated spot at x=0..5
    for x in range(6):
        for y in range(FRAME_H):
            dist = abs(y - cy)
            muzzle_w = 2.5 - x * 0.3
            if dist < muzzle_w:
                brightness = (1.0 - dist / muzzle_w) * (1.0 - x * 0.15)
                if brightness > 0:
                    idx = max(0, int((1.0 - brightness) * 2))
                    r, g, b = PALETTE[idx]
                    a = int(min(255, brightness * 350))
                    cr, cg, cb, ca = pixels[x, y]
                    if a > ca:
                        pixels[x, y] = (r, g, b, a)

    return img


def generate_impact_frame():
    """Frame 5 (last): explosion/impact dissipation — scattered embers + star burst."""
    img = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    pixels = img.load()
    cx, cy = FRAME_W // 2, FRAME_H // 2

    # Central burst
    for angle_deg in range(0, 360, 8):
        rad = math.radians(angle_deg)
        length = random.randint(3, 7)
        for d in range(length):
            x = int(cx + math.cos(rad) * d)
            y = int(cy + math.sin(rad) * d)
            if 0 <= x < FRAME_W and 0 <= y < FRAME_H:
                heat = 1.0 - d / length
                idx = max(0, int((1.0 - heat) * 6))
                r, g, b = PALETTE[idx]
                alpha = int(heat * 255)
                cr, cg, cb, ca = pixels[x, y]
                if alpha > ca:
                    pixels[x, y] = (r, g, b, alpha)

    # Scattered spark dots
    for _ in range(30):
        x = cx + random.randint(-18, 18)
        y = cy + random.randint(-6, 6)
        if 0 <= x < FRAME_W and 0 <= y < FRAME_H:
            idx = random.randint(2, 8)
            r, g, b = PALETTE[idx]
            pixels[x, y] = (r, g, b, random.randint(120, 255))

    # Star at center
    for dx in range(-2, 3):
        for dy in range(-2, 3):
            x, y = cx + dx, cy + dy
            if 0 <= x < FRAME_W and 0 <= y < FRAME_H:
                dist = abs(dx) + abs(dy)
                if dist <= 2:
                    heat = 1.0 - dist * 0.3
                    r, g, b = PALETTE[max(0, int((1.0 - heat) * 2))]
                    pixels[x, y] = (r, g, b, int(heat * 255))

    return img


def main():
    frames = []

    # Frames 0-3: flame building up and varying
    for i in range(4):
        random.seed(42 + i * 17)
        frame = draw_flame_frame(i)
        frames.append(frame)

    # Frame 4: impact/dissipation
    random.seed(99)
    frames.append(generate_impact_frame())

    # Save individual frames
    for i, frame in enumerate(frames):
        frame.save(os.path.join(OUT_DIR, f'flame_frame_{i}.png'))

    # Build spritesheet (horizontal strip: 240x16)
    sheet = Image.new('RGBA', (FRAME_W * FRAMES, FRAME_H), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        sheet.paste(frame, (i * FRAME_W, 0))

    sheet_path = os.path.join(OUT_DIR, 'flamethrower_sheet.png')
    sheet.save(sheet_path)

    # Also generate a scaled-up version (x4) for preview
    preview = sheet.resize((FRAME_W * FRAMES * 4, FRAME_H * 4), Image.NEAREST)
    preview.save(os.path.join(OUT_DIR, 'flamethrower_preview.png'))

    print(f"Generated {FRAMES} frames → {sheet_path}")
    print(f"Frame size: {FRAME_W}x{FRAME_H}, Sheet: {FRAME_W * FRAMES}x{FRAME_H}")


if __name__ == '__main__':
    main()
